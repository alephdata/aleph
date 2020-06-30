import logging
from banal import ensure_list
from flask import Blueprint, request

from aleph.core import db, url_for
from aleph.index.util import MAX_PAGE
from aleph.model import EntitySet
from aleph.logic.entitysets import create_entityset
from aleph.search import EntitySetItemsQuery, SearchQueryParser, QueryParser, DatabaseQueryResult
from aleph.views.context import tag_request
from aleph.views.serializers import EntitySerializer, EntitySetSerializer, EntitySetIndexSerializer
from aleph.views.util import get_nested_collection, get_db_collection
from aleph.views.util import obj_or_404, parse_request


blueprint = Blueprint('entitysets_api', __name__)
log = logging.getLogger(__name__)


@blueprint.route('/api/2/entitysets', methods=['GET'])
def index():
    """Returns a list of entitysets for the role
    ---
    get:
      summary: List entitysets
      parameters:
      - description: The collection id.
        in: query
        name: 'filter:collection_id'
        required: true
        schema:
          minimum: 1
          type: integer
      - type: The type of the entitiyset
        in: query
        name: 'filter:type'
        required: false
      responses:
        '200':
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
                      $ref: '#/components/schemas/EntitySet'
          description: OK
      tags:
        - EntitySet
    """
    parser = QueryParser(request.args, request.authz)
    q = EntitySet.by_authz(request.authz)
    collection_ids = ensure_list(parser.filters.get('collection_id'))
    if len(collection_ids):
        q = q.filter(EntitySet.collection_id.in_(collection_ids))
    types = ensure_list(parser.filters.get('type'))
    if len(types):
        q = q.filter(EntitySet.type.in_(types))
    result = DatabaseQueryResult(request, q, parser=parser)
    return EntitySetIndexSerializer.jsonify_result(result)


@blueprint.route('/api/2/entitysets', methods=['POST', 'PUT'])
def create():
    """Create an entityset.
    ---
    post:
      summary: Create an entityset
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/EntitySetCreate'
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/EntitySet'
          description: OK
      tags:
      - EntitySet
    """
    data = parse_request('EntitySetCreate')
    collection = get_nested_collection(data, request.authz.WRITE)
    entityset = create_entityset(collection, data, request.authz)
    return EntitySetSerializer.jsonify(entityset)


@blueprint.route('/api/2/entitysets/<entityset_id>', methods=['GET'])
def view(entityset_id):
    """Return the entityset with id `entityset_id`.
    ---
    get:
      summary: Fetch an entityset
      parameters:
      - description: The entityset id.
        in: path
        name: entityset_id
        required: true
        schema:
          minimum: 1
          type: integer
        example: 2
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/EntitySet'
          description: OK
      tags:
      - EntitySet
    """
    entityset = obj_or_404(EntitySet.by_id(entityset_id))
    get_db_collection(entityset.collection_id, request.authz.READ)
    return EntitySetSerializer.jsonify(entityset)


@blueprint.route('/api/2/entitysets/<entityset_id>/entities', methods=['GET'])
def entities(entityset_id):
    """Return a search query endpoint for all entities of entityset with id `entityset_id`.
    ---
    get:
      summary: Search entities
      description: >
        Returns a list of entities matching the given search criteria.
        A filter can be applied to show only results from a particular
        collection: `?filter:collection_id={collection_id}`.
        If you know you only want to search documents (unstructured, ingested
        data) or entities (structured data which may have been extracted from
        a dataset, or entered by a human) you can use these arguments with the
        `/documents` or `/entities` endpoints.
      parameters:
      - description: >-
          A query string in ElasticSearch query syntax. Can include field
          searches, such as `title:penguin`
        in: query
        name: q
        schema:
          type: string
      - description: >-
          Return facet values for the given metadata field, such as
          `languages`, `countries`, `mime_type` or `extension`. This can be
          specified multiple times for more than one facet to be added.
        in: query
        name: facet
        schema:
          type: string
      - description: >
          Filter the results by the given field. This is useful when used in
          conjunction with facet to create a drill-down mechanism. Useful
          fields are:
          - `collection_id`, documents belonging to a particular collection.
          - `title`, of the document.
          - `file_name`, of the source file.
          - `source_url`, URL of the source file.
          - `extension`, file extension of the source file.
          - `languages`, in the document.
          - `countries`, associated with the document.
          - `keywords`, from the document.
          - `emails`, email addresses mentioned in the document.
          - `domains`, websites mentioned in the document.
          - `phones`, mentioned in the document.
          - `dates`, in any of the following formats: yyyy-MM-dd, yyyy-MM,
          yyyy-MM-d, yyyy-M, yyyy
          - `mime_type`, of the source file.
          - `author`, according to the source file's metadata.
          - `summary`, of the document.
          - `text`, entire text extracted from the document.
          - `created_at`, when the document was added to aleph (yyyy-mm
          -ddThh:ii:ss.uuuuuu).
          - `updated_at`, when the document was modified in aleph (yyyy
          -mm-ddThh:ii:ss.uuuuuu).
        in: query
        name: 'filter:{field_name}'
        schema:
          type: string
      - description: 'The number of results to return, max. 10,000.'
        in: query
        name: limit
        schema:
          type: integer
      - description: >
            The number of results to skip at the beginning of the result set.
        in: query
        name: offset
        schema:
          type: integer
      responses:
        '200':
          description: Resturns a list of entities in result
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/EntitiesResponse'
      tags:
      - Entity
    """
    entityset = obj_or_404(EntitySet.by_id(entityset_id))
    get_db_collection(entityset.collection_id, request.authz.READ)
    parser = SearchQueryParser(request.args, request.authz)
    tag_request(query=parser.text, prefix=parser.prefix)
    result = EntitySetItemsQuery.handle(request, parser=parser, entityset=entityset)
    links = {}
    if request.authz.logged_in and result.total <= MAX_PAGE:
        query = list(request.args.items(multi=True))
        links['export'] = url_for('entities_api.export',
                                  _authorize=True,
                                  _query=query)
    return EntitySerializer.jsonify_result(result, extra={'links': links})


@blueprint.route('/api/2/entitysets/<entityset_id>', methods=['POST', 'PUT'])
def update(entityset_id):
    """Update the entityset with id `entityset_id`.
    ---
    post:
      summary: Update an entityset
      parameters:
      - description: The entityset id.
        in: path
        name: entityset_id
        required: true
        schema:
          minimum: 1
          type: integer
        example: 2
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/EntitySetUpdate'
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/EntitySet'
          description: OK
      tags:
      - EntitySet
    """
    entityset = obj_or_404(EntitySet.by_id(entityset_id))
    collection = get_db_collection(entityset.collection_id, request.authz.WRITE)
    data = parse_request('EntitySetUpdate')
    entityset.update(data, collection)
    collection.touch()
    db.session.commit()
    return EntitySetSerializer.jsonify(entityset)


@blueprint.route('/api/2/entitysets/<entityset_id>', methods=['DELETE'])
def delete(entityset_id):
    """Delete an entityset.
    ---
    delete:
      summary: Delete an entityset
      parameters:
      - description: The entityset id.
        in: path
        name: entityset_id
        required: true
        schema:
          minimum: 1
          type: integer
        example: 2
      responses:
        '204':
          description: No Content
      tags:
      - EntitySet
    """
    entityset = obj_or_404(EntitySet.by_id(entityset_id))
    collection = get_db_collection(entityset.collection_id, request.authz.WRITE)
    entityset.delete()
    collection.touch()
    db.session.commit()
    return ('', 204)
