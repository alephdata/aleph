from banal import ensure_list, keys_values
from flask import Blueprint, request
from werkzeug.exceptions import BadRequest
from followthemoney import model
from followthemoney.exc import InvalidMapping

from aleph.core import db, settings
from aleph.authz import Authz
from aleph.model import Collection
from aleph.search import CollectionsQuery
from aleph.queues import queue_task, get_status, cancel_queue
from aleph.queues import OP_BULKLOAD, OP_PROCESS
from aleph.logic.collections import create_collection, refresh_collection
from aleph.logic.collections import delete_collection, update_collection
from aleph.logic.processing import bulk_write
from aleph.logic.util import collection_url
from aleph.views.context import enable_cache
from aleph.views.serializers import CollectionSerializer
from aleph.views.util import get_db_collection, get_index_collection
from aleph.views.util import require, parse_request, jsonify
from aleph.views.util import render_xml, get_flag, get_session_id

blueprint = Blueprint('collections_api', __name__)


@blueprint.route('/api/2/collections', methods=['GET'])
def index():
    """
    ---
    get:
      summary: List collections
      description: >-
        Returns a list of collections matching a given query. Returns all the
        collections accessible by a user if no query is given.
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                type: object
                allOf:
                - $ref: '#/components/schemas/QueryResponse'
                properties:
                  results:
                    type: array
                    items:
                      $ref: '#/components/schemas/Collection'
      tags:
      - Collection
    """
    result = CollectionsQuery.handle(request)
    return CollectionSerializer.jsonify_result(result)


@blueprint.route('/api/2/sitemap.xml')
def sitemap():
    """
    ---
    get:
      summary: Get a sitemap
      description: >-
        Returns a site map for search engine robots. This lists each
        published collection on the current instance.
      responses:
        '200':
          description: OK
          content:
            text/xml:
              schema:
                type: object
    """
    enable_cache(vary_user=False)
    collections = []
    for collection in Collection.all_authz(Authz.from_role(None)):
        updated_at = collection.updated_at.date().isoformat()
        updated_at = max(settings.SITEMAP_FLOOR, updated_at)
        collections.append({
            'url': collection_url(collection.id),
            'updated_at': updated_at
        })
    return render_xml('sitemap.xml', collections=collections)


@blueprint.route('/api/2/collections', methods=['POST', 'PUT'])
def create():
    """
    ---
    post:
      summary: Create a collection
      description: Create a collection with the given metadata
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CollectionCreate'
      tags:
        - Collection
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Collection'
    """
    require(request.authz.logged_in)
    data = parse_request('CollectionCreate')
    sync = get_flag('sync')
    collection = create_collection(data, request.authz, sync=sync)
    return CollectionSerializer.jsonify(collection)


@blueprint.route('/api/2/collections/<int:collection_id>', methods=['GET'])
def view(collection_id):
    """
    ---
    get:
      summary: Get a collection
      description: Return the collection with id `collection_id`
      parameters:
      - description: The collection ID.
        in: path
        name: collection_id
        required: true
        schema:
          minimum: 1
          type: integer
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Collection'
      tags:
      - Collection
    """
    collection = get_index_collection(collection_id)
    return CollectionSerializer.jsonify(collection)


@blueprint.route('/api/2/collections/<int:collection_id>', methods=['POST', 'PUT'])  # noqa
def update(collection_id):
    collection = get_db_collection(collection_id, request.authz.WRITE)
    data = parse_request('CollectionUpdate')
    sync = get_flag('sync')
    collection.update(data, request.authz)
    db.session.commit()
    data = update_collection(collection, sync=sync)
    return CollectionSerializer.jsonify(data)


@blueprint.route('/api/2/collections/<int:collection_id>/process', methods=['POST', 'PUT'])  # noqa
def process(collection_id):
    collection = get_db_collection(collection_id, request.authz.WRITE)
    # re-process the documents
    data = {'reset': get_flag('reset', True)}
    queue_task(collection, OP_PROCESS, job_id=get_session_id(), payload=data)
    collection.touch()
    db.session.commit()
    refresh_collection(collection_id)
    return ('', 202)


@blueprint.route('/api/2/collections/<int:collection_id>/mapping', methods=['POST', 'PUT'])  # noqa
def mapping(collection_id):
    collection = get_db_collection(collection_id, request.authz.WRITE)
    require(request.authz.can_bulk_import())
    if not request.is_json:
        raise BadRequest()
    data = request.get_json().get(collection.foreign_id)
    for query in keys_values(data, 'queries', 'query'):
        try:
            model.make_mapping(query)
        except InvalidMapping as invalid:
            raise BadRequest(invalid)
    queue_task(collection, OP_BULKLOAD, job_id=get_session_id(), payload=data)
    collection.touch()
    db.session.commit()
    refresh_collection(collection_id)
    return ('', 202)


@blueprint.route('/api/2/collections/<int:collection_id>/_bulk', methods=['POST'])  # noqa
@blueprint.route('/api/2/collections/<int:collection_id>/bulk', methods=['POST'])  # noqa
def bulk(collection_id):
    collection = get_db_collection(collection_id, request.authz.WRITE)
    require(request.authz.can_bulk_import())
    job_id = get_session_id()

    # This will disable checksum security measures in order to allow bulk
    # loading of document data.
    unsafe = get_flag('unsafe', default=False)
    unsafe = unsafe and request.authz.is_admin

    entities = ensure_list(request.get_json(force=True))
    bulk_write(collection, entities, job_id=job_id, unsafe=unsafe)
    collection.touch()
    db.session.commit()
    refresh_collection(collection_id)
    return ('', 204)


@blueprint.route('/api/2/collections/<int:collection_id>/status', methods=['GET'])  # noqa
def status(collection_id):
    collection = get_db_collection(collection_id, request.authz.READ)
    return jsonify(get_status(collection))


@blueprint.route('/api/2/collections/<int:collection_id>/status', methods=['DELETE'])  # noqa
def cancel(collection_id):
    collection = get_db_collection(collection_id, request.authz.WRITE)
    cancel_queue(collection)
    return ('', 204)


@blueprint.route('/api/2/collections/<int:collection_id>', methods=['DELETE'])
def delete(collection_id):
    """
    ---
    delete:
      summary: Delete a collection
      description: Delete the collection with id `collection_id`
      parameters:
      - description: The collection ID.
        in: path
        name: collection_id
        required: true
        schema:
          minimum: 1
          type: integer
      responses:
        '204':
          description: No Content
      tags:
        - Collection
    """
    collection = get_db_collection(collection_id, request.authz.WRITE)
    sync = get_flag('sync', default=True)
    delete_collection(collection, sync=sync)
    return ('', 204)
