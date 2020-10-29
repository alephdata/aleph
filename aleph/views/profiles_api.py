import logging
from flask import Blueprint, request

from aleph.logic.profiles import get_profile
from aleph.views.serializers import ProfileSerializer
from aleph.views.util import obj_or_404

blueprint = Blueprint("profiles_api", __name__)
log = logging.getLogger(__name__)


@blueprint.route("/api/2/profiles/<profile_id>", methods=["GET"])
def view(profile_id):
    """
    ---
    get:
      summary: Retrieve a profile
      description: >-
        Get a profile with constituent items and the merged pseudo entity.
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Profile'
      tags:
      - Profile
    """
    profile = obj_or_404(get_profile(profile_id, authz=request.authz))
    return ProfileSerializer.jsonify(profile)
