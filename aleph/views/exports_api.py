import logging

from flask import Blueprint, request, redirect, send_file, Response
from werkzeug.exceptions import NotFound, Forbidden

from aleph.core import archive
from aleph.model import Export
from aleph.search import DatabaseQueryResult
from aleph.views.serializers import ExportSerializer
from aleph.views.util import require, obj_or_404

log = logging.getLogger(__name__)
blueprint = Blueprint("exports_api", __name__)


@blueprint.route("/api/2/exports", methods=["GET"])
def index():
    """Returns a list of exports for the user.
    ---
    get:
      summary: List exports
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
                      $ref: '#/components/schemas/Export'
          description: OK
      tags:
        - Export
    """
    require(request.authz.logged_in)
    query = Export.by_role_id(request.authz.id)
    result = DatabaseQueryResult(request, query)
    return ExportSerializer.jsonify_result(result)


@blueprint.route("/api/2/exports/<int:export_id>/download", methods=["GET"])
def download(export_id):
    """Downloads the exported file from the archive.
    ---
    get:
      summary: Download an export from the archive
      parameters:
      - description: export id
        in: path
        name: export_id
        required: true
        schema:
          type: string
      - description: Authorization token for an export
        in: query
        name: claim
        required: false
        schema:
          type: string
          description: A signed JWT with the object hash.
      responses:
        '200':
          description: OK
          content:
            '*/*': {}
        '404':
          description: Object does not exist.
      tags:
      - Export
    """
    require(request.authz.logged_in)
    export = obj_or_404(Export.by_id(export_id, role_id=request.authz.id))
    url = archive.generate_publication_url(
            export.namespace,
            export.content_hash,
            mime_type=export.mime_type,
            expire=export.expires_at,
            attachment_name=export.file_name,
        )
    if url is not None:
        return redirect(url)
    local_path = archive.load_publication(export.namespace, export.content_hash)
    if local_path is None:
        raise NotFound()
    return send_file(
        str(local_path),
        as_attachment=True,
        conditional=True,
        attachment_filename=export.file_name,
        mimetype=export.mime_type,
    )
