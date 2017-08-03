import logging
from pprint import pprint  # noqa
from elasticsearch.helpers import scan
from flask import request
import xlsxwriter
import StringIO

from aleph.core import db, es, es_index
from aleph.model import Collection, Match
from aleph.logic.collections import collection_url
from aleph.logic.entities import entity_url
from aleph.index import TYPE_ENTITY, TYPE_DOCUMENT
from aleph.index.xref import entity_query
from aleph.index.util import unpack_result
from aleph.search import QueryParser, MatchQueryResult
from aleph.views.serializers import MatchSchema

log = logging.getLogger(__name__)


def xref_item(item):
    """Cross-reference an entity or document, given as an indexed document."""
    title = item.get('name') or item.get('title')
    log.info("Xref [%s]: %s", item['$type'], title)

    result = es.search(index=es_index,
                       doc_type=TYPE_ENTITY,
                       body={
                           'query': entity_query(item),
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


def xref_collection(collection):
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
                   query=query)
    for i, res in enumerate(scanner):
        xref_item(unpack_result(res))
        if i % 1000 == 0 and i != 0:
            db.session.commit()
    db.session.commit()


def get_matched_entities(collection, matches_summary):
    """ Returns a list of entities from a summary query. """
    # TODO: Do something about auth here
    parser = QueryParser(request.args, request.authz, limit=1000)
    matches = []
    for match in matches_summary.all():
        q_match = Match.find_by_collection(collection.id, match.collection.id)
        results_match = MatchQueryResult(request, q_match,
                                         parser=parser,
                                         schema=MatchSchema)
        matches.append(results_match)
    return matches


def generate_excel(collection):

    output = StringIO.StringIO()
    workbook = xlsxwriter.Workbook(output)

    bold = workbook.add_format({'bold': 1})
    link_format = workbook.add_format({
        'font_color': 'blue',
        'underline': 1
    })

    # Query for all the collections with matches
    q_summary = Match.group_by_collection(collection.id)

    # Write the summary worksheet (Collection names and count)
    ws_summary_name = make_excel_safe_name('Summary %s' % collection.label)
    summary_sheet = workbook.add_worksheet(ws_summary_name)
    summary_sheet.write(0, 0, 'Collection', bold)
    summary_sheet.write(0, 1, 'Matches', bold)
    col = 0
    row = 1
    
    for result in q_summary.all():
        url = collection_url(result.collection.id)
        summary_sheet.write_url(
            row, col, url, link_format, result.collection.label)
        summary_sheet.write_number(row, col+1, result.matches)
        row += 1

    # Write the details worksheet (pairs of matches and scores)
    ws_matches_name = make_excel_safe_name('Matches %s' % collection.label)
    details_sheet = workbook.add_worksheet(ws_matches_name)

    headers = ['Collection', 'Score',
               'Entity', 'Entity type', 'Entity jurisdiction',
               'Match', 'Match type', 'Match jurisdiction']
    for col, header in enumerate(headers):
        details_sheet.write(0, col, header, bold)

    col = 0
    row = 1
    # Fetch individual matches from summary results and write them
    all_matches = get_matched_entities(collection, q_summary)
    for match in all_matches:
        for result in match.results:
            
            col_url = collection_url(result.match['collection_id'])
            ent_url = entity_url(result.entity_id)
            match_url = entity_url(result.match_id)

            details_sheet.write_url(row, col, col_url, link_format, str(result.match[
                                    'collection_id']))  # TODO: Collection name
            details_sheet.write_number(row, col+1, result.score)

            details_sheet.write_url(
                row, col+2, ent_url, link_format, result.entity['name'])
            details_sheet.write_string(row, col+3, result.entity['schema'])
            details_sheet.write_string(row, col+4, ', '.join(result.entity['countries']))

            details_sheet.write_url(
                row, col+5, match_url, link_format, result.match['name'])
            details_sheet.write_string(row, col+6, result.match['schema'])
            try:
                details_sheet.write_string(row, col+7, ', '.join(result.match['countries']))
            except KeyError:
                continue

            row += 1

    workbook.close()
    output.seek(0)
    return output

def make_excel_safe_name(name):
    name.replace("_", " ").strip()
    return name[:30]