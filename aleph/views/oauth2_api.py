from flask import Blueprint, request
from aleph.views.util import require
from aleph.oauth2.server import server

blueprint = Blueprint("oauth2_api", __name__)


@blueprint.route("/api/2/oauth2/authorize", methods=["GET", "POST"])
def authorize():
    require(request.authz.logged_in)

    # This is where we'd usually display a page and ask the user
    # whether they'd like to authorize the OAuth app before granting
    # auhorization to the app.

    return server.create_authorization_response(
        grant_user=request.authz.role,
    )


@blueprint.route("/api/2/oauth2/token", methods=["POST"])
def issue_token():
    return server.create_token_response()
