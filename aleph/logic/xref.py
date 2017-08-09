import logging
from pprint import pprint  # noqa
from elasticsearch.helpers import scan
import xlsxwriter
import StringIO

from aleph.core import db, es, es_index, schemata
from aleph.model import Match
from aleph.logic.collections import collection_url
from aleph.logic.entities import entity_url
from aleph.index import TYPE_ENTITY, TYPE_DOCUMENT
from aleph.index.xref import entity_query, entity_collection_query
from aleph.index.util import unpack_result
from aleph.search import QueryParser, MatchQueryResult

log = logging.getLogger(__name__)


def xref_item(item, against_coll_id=None):
    """Cross-reference an entity or document, given as an indexed document."""
    title = item.get('name') or item.get('title')
    log.info("Xref [%s]: %s", item['$type'], title)

    if against_coll_id is None:
        query = entity_query(item)
    else:
        query = entity_collection_query(item, against_coll_id)

    result = es.search(index=es_index,
                       doc_type=TYPE_ENTITY,
                       body={
                           'query': query,
                           'size': 100,
                           '_source': ['collection_id'],
                       })
    results = result.get('hits').get('hits')
    entity_id, document_id = None, None
    if item.get('$type') == TYPE_DOCUMENT:
        document_id = item.get('id')
    else:
        entity_id = item.get('id')
    dq = db.session.query(Match)
    dq = dq.filter(Match.entity_id == entity_id)
    dq = dq.filter(Match.document_id == document_id)
    dq.delete()
    matches = []
    for result in results:
        source = result.get('_source', {})
        obj = Match()
        obj.entity_id = entity_id
        obj.document_id = document_id
        obj.collection_id = item.get('collection_id')
        obj.match_id = result.get('_id')
        obj.match_collection_id = source.get('collection_id')
        obj.score = result.get('_score')
        matches.append(obj)
    db.session.bulk_save_objects(matches)


def xref_collection(collection, collection2=None):
    """Cross-reference all the entities and documents in a collection."""
    log.info("Cross-reference collection: %r", collection)
    query = {
        'query': {
            'term': {'collection_id': collection.id}
        }
    }
    scanner = scan(es,
                   index=es_index,
                   doc_type=[TYPE_ENTITY, TYPE_DOCUMENT],
                   query=query,
                   scroll='15m',
                   size=1000)

    try:
        against_id = collection2.id
    except AttributeError:
        against_id = None

    for i, res in enumerate(scanner):
        xref_item(unpack_result(res), against_id)
        if i % 1000 == 0 and i != 0:
            db.session.commit()
    db.session.commit()


def make_excel_safe_name(collection):
    name = '%s. %s' % (collection.id, collection.label)
    for char in '[]:*?/\\':
        name = name.replace(char, " ").strip()
    return name[:30]


def generate_matches_sheet(workbook, collection, match_collection, authz,
                           links=True):
    from aleph.views.serializers import MatchSchema

    sheet_name = make_excel_safe_name(match_collection)
    sheet = workbook.add_worksheet(sheet_name)
    sheet.set_zoom(125)
    parser = QueryParser({}, authz, limit=1000)
    q_match = Match.find_by_collection(collection.id, match_collection.id)
    matches = MatchQueryResult({}, q_match, parser=parser, schema=MatchSchema)

    sheet.write(0, 0, '', workbook.header_format)
    sheet.write(1, 0, 'Score', workbook.header_format)
    sheet.merge_range(0, 1, 0, 4, collection.label, workbook.header_format)
    sheet.write(1, 1, 'Name', workbook.header_format)
    sheet.write(1, 2, 'Type', workbook.header_format)
    sheet.write(1, 3, 'Country', workbook.header_format)
    sheet.write(1, 4, 'Source URL', workbook.header_format)
    sheet.merge_range(0, 5, 0, 7,
                      match_collection.label,
                      workbook.header_format)
    sheet.write(1, 5, 'Name', workbook.header_format)
    sheet.write(1, 6, 'Type', workbook.header_format)
    sheet.write(1, 7, 'Country', workbook.header_format)

    sheet.freeze_panes(2, 0)
    sheet.autofilter(1, 1, 2 + len(matches.results), 7)
    widths = {}
    for row, result in enumerate(matches.results, 2):
        sheet.write_number(row, 0, int(result.score))
        name = result.entity.get('name')
        widths[1] = max(widths.get(1, 0), len(name))
        if links:
            url = entity_url(result.entity_id)
            sheet.write_url(row, 1, url, workbook.link_format, name)
        else:
            sheet.write_string(row, 1, name)
        schema = schemata.get(result.entity['schema'])
        sheet.write_string(row, 2, schema.label)
        countries = ', '.join(sorted(result.entity.get('countries', [])))
        sheet.write_string(row, 3, countries.upper())
        ent_props = result.entity.get('properties', {})
        source_url = ', '.join(ent_props.get('sourceUrl'))
        sheet.write_string(row, 4, source_url)

        name = result.match.get('name')
        widths[5] = max(widths.get(5, 0), len(name))
        if links:
            url = entity_url(result.match_id)
            sheet.write_url(row, 5, url, workbook.link_format, name)
        else:
            sheet.write_string(row, 5, name)
        schema = schemata.get(result.match['schema'])
        sheet.write_string(row, 6, schema.label)
        countries = ', '.join(sorted(result.match.get('countries', [])))
        sheet.write_string(row, 7, countries.upper())

    for idx, max_len in widths.items():
        max_len = min(70, max(7, max_len + 1))
        sheet.set_column(idx, idx, float(max_len))

    return sheet_name


def generate_excel(collection, authz, links=True):
    output = StringIO.StringIO()
    workbook = xlsxwriter.Workbook(output)
    workbook.link_format = workbook.add_format({
        'font_color': 'blue',
        'underline': True
    })
    workbook.header_format = workbook.add_format({
        'font_color': 'white',
        'fg_color': '#982022',
        'bold': True
    })

    # Write the summary worksheet (Collection names and count)
    sheet = workbook.add_worksheet('Summary')
    sheet.set_zoom(125)
    title = 'Cross-referencing: %s' % collection.label
    sheet.merge_range(0, 0, 0, 2, title, workbook.header_format)
    sheet.write(1, 0, 'Collection', workbook.header_format)
    sheet.write(1, 1, 'Matches', workbook.header_format)
    sheet.write(1, 2, 'Details', workbook.header_format)
    sheet.set_column(2, 2, 20)
    sheet.freeze_panes(1, 0)

    # Query for all the collections with matches
    collections = Match.group_by_collection(collection.id, authz=authz)
    max_label = 70
    for row, result in enumerate(collections, 2):
        if links:
            url = collection_url(result.collection.id)
            sheet.write_url(row, 0, url, workbook.link_format,
                            result.collection.label)
        else:
            sheet.write_string(row, 0, result.collection.label)
        max_label = max(max_label, len(result.collection.label))
        sheet.set_column(0, 0, float(max_label))
        sheet.write_number(row, 1, result.matches)
        name = generate_matches_sheet(workbook,
                                      collection,
                                      result.collection,
                                      authz,
                                      links=links)
        url = "internal:'%s'!B3" % name
        sheet.write_url(row, 2, url, workbook.link_format, 'See matches')

    workbook.close()
    output.seek(0)
    return output
