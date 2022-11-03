import logging
from flask import Blueprint, request
from aleph.views.util import jsonify, require


log = logging.getLogger(__name__)
blueprint = Blueprint("bookmarks_api", __name__)


@blueprint.route("/api/2/bookmarks", methods=["POST"])
def create():
    """Creates a new bookmark for the user. This is currently a stub endpoint,
    as the current version of the bookmarks features stores bookmarks client side.
    ---
    post:
      summary: Create bookmark
      responses:
        '200':
          content:
            application/json:
              schema:
                type: object
          description: OK
      tags:
        - Bookmarks
    """
    require(request.authz.logged_in)
    log.info("User [%s]: Created bookmark", request.authz.role.id)
    return jsonify({}, 200)


@blueprint.route("/api/2/bookmarks/<bookmark_id>", methods=["DELETE"])
def delete(bookmark_id):
    """Delete a bookmark. This is currently a stub endpoint, as the current version
    of the bookmarks features stores bookmarks client side.
    ---
    delete:
      summary: Delete bookmark
      responses:
        '200':
          content:
            application/json:
              schema:
                type: object
          description: OK
      tags:
        - Bookmarks
    """
    require(request.authz.logged_in)
    log.info("User [%s]: Deleted bookmark", request.authz.role.id)
    return jsonify({}, 200)
