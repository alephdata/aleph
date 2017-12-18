import jwt
import logging
from datetime import datetime, timedelta

from aleph.core import get_config

log = logging.getLogger(__name__)


def get_jwt_secret():
    return get_config('SECRET_KEY')


def create_token(role):
    from aleph.serializers.roles import RoleSchema
    role, _ = RoleSchema().dump(role)
    role.pop('created_at', None)
    role.pop('updated_at', None)
    exp = datetime.utcnow() + timedelta(days=7)
    payload = {
        'role': role,
        'exp': exp
    }
    return jwt.encode(payload, get_jwt_secret())


def check_token(token):
    try:
        data = jwt.decode(token, key=get_jwt_secret(), verify=True)
        return data.get('role')
    except jwt.DecodeError:
        return None
