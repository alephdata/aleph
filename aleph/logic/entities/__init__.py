import logging
from banal import is_mapping
from followthemoney import model
from followthemoney.types import registry

from aleph.core import es, db, cache
from aleph.model import Entity, Collection
from aleph.index import entities as index
from aleph.index.indexes import entities_read_index
from aleph.index.util import authz_query, field_filter_query
from aleph.logic.notifications import flush_notifications

log = logging.getLogger(__name__)


def create_entity(data, collection, role=None, sync=False):
    entity = Entity.create(data, collection)
    db.session.commit()
    data = index.index_entity(entity, sync=sync)
    refresh_entity(entity)
    return data


def update_entity(entity, sync=False):
    # TODO: delete from index upon type change.
    data = index.index_entity(entity, sync=sync)
    refresh_entity(entity)
    return data


def refresh_entity(entity, sync=False):
    if is_mapping(entity):
        entity_id = entity.get('id')
        collection_id = entity.get('collection_id')
    else:
        entity_id = entity.id
        collection_id = entity.collection_id
    cache.kv.delete(cache.object_key(Entity, entity_id),
                    cache.object_key(Collection, collection_id))


def delete_entity(entity, deleted_at=None, sync=False):
    flush_notifications(entity)
    entity.delete(deleted_at=deleted_at)
    refresh_entity(entity)
    index.delete_entity(entity.id, sync=sync)


def entity_references(entity, authz):
    """Given a particular entity, find all the references to it from other
    entities, grouped by the property where they are used."""
    schema = model.get(entity.get('schema'))
    group = registry.entity.group
    facets = []
    for prop in model.properties:
        if prop.type != registry.entity:
            continue
        if not schema.is_a(prop.range):
            continue

        index = entities_read_index(prop.schema)
        field = 'properties.%s' % prop.name
        value = entity.get('id')
        facets.append((index, prop.qname, group, field, value))

    res = _filters_faceted_query(authz, facets)
    for (qname, total) in res.items():
        if total > 0:
            yield (model.get_qname(qname), total)


def entity_tags(entity, authz):
    """Do a search on tags of an entity."""
    proxy = model.get_proxy(entity)
    Thing = model.get(Entity.THING)
    types = [registry.name, registry.email, registry.identifier,
             registry.iban, registry.phone, registry.address]
    facets = []
    # Go through all the tags which apply to this entity, and find how
    # often they've been mentioned in other entities.
    for type_ in types:
        if type_.group is None:
            continue
        for fidx, value in enumerate(proxy.get_type_values(type_)):
            if type_.specificity(value) < 0.1:
                continue
            schemata = model.get_type_schemata(type_)
            schemata = [s for s in schemata if s.is_a(Thing)]
            index = entities_read_index(schemata)
            alias = '%s_%s' % (type_.name, fidx)
            facets.append((index, alias, type_.group, type_.group, value))

    res = _filters_faceted_query(authz, facets)
    for (_, alias, field, _, value) in facets:
        total = res.get(alias, 0)
        if total > 1:
            yield (field, value, total)


def _filters_faceted_query(authz, facets):
    filters = {}
    indexed = {}
    for (idx, alias, group, field, value) in facets:
        indexed[idx] = indexed.get(idx, {})
        indexed[idx][alias] = field_filter_query(field, value)
        filters[idx] = filters.get(idx, {})
        filters[idx][group] = filters[idx].get(group, [])
        filters[idx][group].append(value)

    queries = []
    for (idx, facets) in indexed.items():
        shoulds = []
        for field, values in filters[idx].items():
            shoulds.append(field_filter_query(field, values))
        query = {
            'bool': {
                'should': shoulds,
                'filter': [authz_query(authz)],
                'minimum_should_match': 1
            }
        }
        queries.append({'index': idx})
        queries.append({
            'size': 0,
            'query': query,
            'aggs': {'counters': {'filters': {'filters': facets}}}
        })

    results = {}
    if not len(queries):
        return results

    res = es.msearch(body=queries)
    for resp in res.get('responses', []):
        aggs = resp.get('aggregations', {}).get('counters', {})
        for alias, value in aggs.get('buckets', {}).items():
            results[alias] = value.get('doc_count', results.get(alias, 0))
    return results
