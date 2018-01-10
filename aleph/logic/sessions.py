import jwt
import logging
from datetime import datetime, timedelta

from aleph.core import settings

log = logging.getLogger(__name__)


def create_token(role):
    from aleph.serializers.roles import RoleSchema
    role, _ = RoleSchema().dump(role)
    role.pop('created_at', None)
    role.pop('updated_at', None)
    exp = datetime.utcnow() + timedelta(days=7)
    payload = {
        'role': role,
        # 'api_key': role.api_key,
        'exp': exp
    }
    return jwt.encode(payload, settings.SECRET_KEY)


def check_token(token):
    try:
        data = jwt.decode(token, key=settings.SECRET_KEY, verify=True)
        return data.get('role')
    except jwt.DecodeError:
        return None
