import logging
from flask import Blueprint, request
from werkzeug.exceptions import NotFound, Forbidden, BadRequest

from aleph.core import db
from aleph.search import DatabaseQueryResult
from aleph.views.util import jsonify, require, parse_request, get_index_entity
from aleph.views.serializers import BookmarkSerializer
from aleph.model import Bookmark


log = logging.getLogger(__name__)
blueprint = Blueprint("bookmarks_api", __name__)


@blueprint.route("/api/2/bookmarks", methods=["GET"])
def index():
    """Get a list of bookmarks created by the current role
    ---
    get:
      summary: Get bookmarks
      tags: [Bookmarks]
      parameters:
        - in: query
          name: limit
          description: Number of bookmarks to return
          schema:
            type: number
        - in: query
          name: offset
          description: Number of bookmarks to skip
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/BookmarksResponse'
    """
    authz = request.authz
    require(authz.logged_in)
    collection_ids = authz.collections(authz.READ)

    query = Bookmark.query.filter(
        Bookmark.role_id == request.authz.id,
        Bookmark.collection_id.in_(collection_ids),
    ).order_by(Bookmark.created_at.desc())
    result = DatabaseQueryResult(request, query)
    return BookmarkSerializer.jsonify_result(result)


@blueprint.route("/api/2/bookmarks", methods=["POST"])
def create():
    """Bookmark one or more entities.
    ---
    post:
      summary: Create bookmark
      tags: [Bookmarks]
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/BookmarkCreate'
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Bookmark'
    """
    require(request.authz.session_write)
    data = parse_request("BookmarkCreate")
    entity_id = data.get("entity_id")

    try:
        entity = get_index_entity(entity_id, request.authz.READ)
    except (NotFound, Forbidden):
        raise BadRequest(
            "Could not bookmark the given entity as the entity does not exist or you do not have access."
        )

    query = Bookmark.query.filter_by(entity_id=entity_id, role_id=request.authz.id)
    bookmark = query.first()

    if not bookmark:
        bookmark = Bookmark(
            entity_id=entity_id,
            collection_id=entity.get("collection_id"),
            role_id=request.authz.id,
        )

        db.session.add(bookmark)
        db.session.commit()

    serializer = BookmarkSerializer()
    response = serializer.serialize(bookmark)
    return jsonify(response, status=201)


@blueprint.route("/api/2/bookmarks/<entity_id>", methods=["DELETE"])
def delete(entity_id):
    """Delete a bookmark.
    ---
    delete:
      summary: Delete bookmark
      tags: [Bookmarks]
      parameters:
        - in: path
          name: entity_id
          description: ID of the bookmarked entitiy
          required: true
          schema:
            type: string
      responses:
        '204':
          description: No content
    """
    require(request.authz.session_write)

    query = Bookmark.query.filter_by(entity_id=entity_id, role_id=request.authz.id)
    query.delete()
    db.session.commit()

    return "", 204
