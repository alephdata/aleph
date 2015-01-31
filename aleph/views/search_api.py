from flask import Blueprint, request

from aleph import authz
from aleph.core import url_for
from aleph.model import Entity
from aleph.views.util import jsonify, Pager
from aleph.crawlers import get_sources
from aleph.search.queries import document_query
from aleph.search import search_documents

blueprint = Blueprint('search', __name__)


def add_urls(doc):
    doc['source'] = get_sources().get(doc.get('source'))
    doc['archive_url'] = url_for('data.package',
                                 collection=doc.get('collection'),
                                 package_id=doc.get('id'))
    doc['manifest_url'] = url_for('data.manifest',
                                  collection=doc.get('collection'),
                                  package_id=doc.get('id'))
    return doc


def transform_facets(aggregations):
    coll = aggregations.get('all', {}).get('ftr', {}).get('collections', {})
    coll = coll.get('buckets', [])
    ents = aggregations.get('lists', {}).get('entities', {}).get('buckets', [])
    objs = Entity.by_id_set([e.get('key') for e in ents])
    entities = []
    for entity in ents:
        entity['entity'] = objs.get(entity.get('key'))
        if entity['entity'] is not None:
            entities.append(entity)
    return {
        'collections': coll,
        'entities': entities
    }


@blueprint.route('/api/1/query')
def query():
    collections = authz.authz_collections('read')
    lists = authz.authz_lists('read')
    query = document_query(request.args, collections=collections, lists=lists)
    pager = Pager(search_documents(query),
                  results_converter=lambda ds: [add_urls(d) for d in ds])
    data = pager.to_dict()
    raw = pager._results.result
    data['facets'] = transform_facets(raw.get('aggregations', {}))
    return jsonify(data)
