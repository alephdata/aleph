import shutil
from dataclasses import dataclass
import logging
from pprint import pprint  # noqa
from tempfile import mkdtemp

from followthemoney import model, compare
from followthemoney.types import registry
from followthemoney.export.excel import ExcelWriter
from followthemoney.exc import InvalidData
from followthemoney.helpers import name_entity
from followthemoney.proxy import EntityProxy
from followthemoney_predict import xref
from servicelayer.archive.util import ensure_path

from aleph.core import es, db
from aleph.model import Collection, Entity, Role, Export, Status
from aleph.authz import Authz
from aleph.logic import resolver
from aleph.logic.collections import reindex_collection
from aleph.logic.aggregator import get_aggregator
from aleph.logic.matching import match_query
from aleph.logic.util import entity_url
from aleph.index.xref import index_matches, delete_xref, iter_matches
from aleph.index.entities import iter_proxies, entities_by_ids
from aleph.index.entities import ENTITY_SOURCE
from aleph.index.indexes import entities_read_index
from aleph.index.collections import delete_entities
from aleph.index.util import unpack_result, none_query
from aleph.index.util import BULK_PAGE
from aleph.logic.export import complete_export
from aleph import settings


log = logging.getLogger(__name__)
COMPARE_SCORE_CUTOFF = 0.35
COMPARE_MODEL = None
COMPARE_MODEL_NAME = None
ORIGIN = "xref"


@dataclass
class XrefResult:
    score: float
    entity: EntityProxy
    match_collection_id: str
    match: EntityProxy
    method: str


def _load_compare_model():
    global COMPARE_MODEL, COMPARE_MODEL_NAME, COMPARE_SCORE_CUTOFF
    if COMPARE_MODEL is None:
        model_name = settings.FOLLOWTHEMONEY_PREDICT_MODEL
        if model_name is None:
            COMPARE_MODEL = compare
            COMPARE_SCORE_CUTOFF = 0.35
            COMPARE_MODEL_NAME = "ftm.compare"
        else:
            model = COMPARE_MODEL = xref.XrefModel.load(model_name)
            COMPARE_SCORE_CUTOFF = 0.5
            COMPARE_MODEL_NAME = str(model)
    return COMPARE_MODEL, COMPARE_MODEL_NAME, COMPARE_SCORE_CUTOFF


def _merge_schemata(proxy, schemata):
    for other in schemata:
        try:
            other = model.get(other)
            proxy.schema = model.common_schema(proxy.schema, other)
        except InvalidData:
            proxy.schema = model.get(Entity.LEGAL_ENTITY)


def _query_item(entity):
    """Cross-reference an entity or document, given as an indexed document."""
    query = match_query(entity)
    if query == none_query():
        return

    log.debug("Candidate [%s]: %s", entity.schema.name, entity.caption)
    query = {"query": query, "size": 50, "_source": ENTITY_SOURCE}
    index = entities_read_index(schema=list(entity.schema.matchable_schemata))
    result = es.search(index=index, body=query)
    compare_model, compare_model_name, compare_cutoff = _load_compare_model()
    for result in result.get("hits").get("hits"):
        result = unpack_result(result)
        if result is None:
            continue
        match = model.get_proxy(result)
        try:
            score = compare_model.compare(model, entity, match)
        except InvalidData:
            continue
        if score >= compare_cutoff:
            log.debug(
                "Match: [%s] %s <[%.2f]> %s",
                compare_model,
                entity.caption,
                score,
                match.caption,
            )
            yield XrefResult(
                score=score,
                entity=entity,
                match_collection_id=result.get("collection_id"),
                match=match,
                method=compare_model_name,
            )


def _iter_mentions(collection):
    """Combine mentions into pseudo-entities used for xref."""
    log.info("[%s] Generating mention-based xref...", collection)
    proxy = model.make_entity(Entity.LEGAL_ENTITY)
    for mention in iter_proxies(
        collection_id=collection.id,
        schemata=["Mention"],
        sort={"properties.resolved": "desc"},
    ):
        resolved_id = mention.first("resolved")
        if resolved_id != proxy.id:
            if proxy.id is not None:
                yield proxy
            proxy = model.make_entity(Entity.LEGAL_ENTITY)
            proxy.id = resolved_id
        _merge_schemata(proxy, mention.get("detectedSchema"))
        proxy.add("name", mention.get("name"))
        proxy.add("country", mention.get("contextCountry"))
    if proxy.id is not None:
        yield proxy


def _query_mentions(collection):
    aggregator = get_aggregator(collection, origin=ORIGIN)
    aggregator.delete(origin=ORIGIN)
    writer = aggregator.bulk()
    for proxy in _iter_mentions(collection):
        schemata = set()
        countries = set()
        for result in _query_item(proxy):
            schemata.add(result.match.schema)
            countries.update(result.match.get_type_values(registry.country))
            yield result
        if len(schemata):
            # Assign only those countries that are backed by one of
            # the matches:
            countries = countries.intersection(proxy.get("country"))
            proxy.set("country", countries)
            # Try to be more specific about schema:
            _merge_schemata(proxy, schemata)
            # Pick a principal name:
            proxy = name_entity(proxy)
            proxy.context["mutable"] = True
            log.debug("Reifying [%s]: %s", proxy.schema.name, proxy)
            writer.put(proxy, fragment="mention")
            # pprint(proxy.to_dict())
    writer.flush()
    aggregator.close()


def _query_entities(collection):
    """Generate matches for indexing."""
    log.info("[%s] Generating entity-based xref...", collection)
    matchable = [s for s in model if s.matchable]
    for proxy in iter_proxies(collection_id=collection.id, schemata=matchable):
        yield from _query_item(proxy)


def xref_collection(stage, collection):
    """Cross-reference all the entities and documents in a collection."""
    log.info("[%s] Clearing previous xref state....", collection)
    delete_xref(collection, sync=True)
    delete_entities(collection.id, origin=ORIGIN, sync=True)
    index_matches(collection, _query_entities(collection))
    index_matches(collection, _query_mentions(collection))
    log.info("[%s] Xref done, re-indexing to reify mentions...", collection)
    reindex_collection(collection, sync=False)


def _format_date(proxy):
    dates = proxy.get_type_values(registry.date)
    if not len(dates):
        return ""
    return min(dates)


def _format_country(proxy):
    countries = [c.upper() for c in proxy.countries]
    return ", ".join(countries)


def _iter_match_batch(stub, sheet, batch):
    matchable = [s.name for s in model if s.matchable]
    entities = set()
    for match in batch:
        entities.add(match.get("entity_id"))
        entities.add(match.get("match_id"))
        resolver.queue(stub, Collection, match.get("match_collection_id"))

    resolver.resolve(stub)
    entities = entities_by_ids(list(entities), schemata=matchable)
    entities = {e.get("id"): e for e in entities}

    for obj in batch:
        entity = entities.get(str(obj.get("entity_id")))
        match = entities.get(str(obj.get("match_id")))
        collection_id = obj.get("match_collection_id")
        collection = resolver.get(stub, Collection, collection_id)
        if entity is None or match is None or collection is None:
            continue
        eproxy = model.get_proxy(entity)
        mproxy = model.get_proxy(match)
        sheet.append(
            [
                obj.get("score"),
                eproxy.caption,
                _format_date(eproxy),
                _format_country(eproxy),
                collection.get("label"),
                mproxy.caption,
                _format_date(mproxy),
                _format_country(mproxy),
                entity_url(eproxy.id),
                entity_url(mproxy.id),
            ]
        )


def export_matches(export_id):
    """Export the top N matches of cross-referencing for the given collection
    to an Excel formatted export."""
    export = Export.by_id(export_id)
    export_dir = ensure_path(mkdtemp(prefix="aleph.export."))
    try:
        role = Role.by_id(export.creator_id)
        authz = Authz.from_role(role)
        collection = Collection.by_id(export.collection_id)
        file_name = "%s - Crossreference.xlsx" % collection.label
        file_path = export_dir.joinpath(file_name)
        excel = ExcelWriter()
        headers = [
            "Score",
            "Entity Name",
            "Entity Date",
            "Entity Countries",
            "Candidate Collection",
            "Candidate Name",
            "Candidate Date",
            "Candidate Countries",
            "Entity Link",
            "Candidate Link",
        ]
        sheet = excel.make_sheet("Cross-reference", headers)
        batch = []

        for match in iter_matches(collection, authz):
            batch.append(match)
            if len(batch) >= BULK_PAGE:
                _iter_match_batch(excel, sheet, batch)
                batch = []
        if len(batch):
            _iter_match_batch(excel, sheet, batch)

        with open(file_path, "wb") as fp:
            buffer = excel.get_bytesio()
            for data in buffer:
                fp.write(data)

        complete_export(export_id, file_path)
    except Exception:
        log.exception("Failed to process export [%s]", export_id)
        export = Export.by_id(export_id)
        export.set_status(status=Status.FAILED)
        db.session.commit()
    finally:
        shutil.rmtree(export_dir)
