from aleph.model import Role


def check_visible(role, authz):
    """Users should not see group roles which they are not a part of."""
    if authz.is_admin or role.id in authz.roles:
        return True
    return role.type == Role.USER
