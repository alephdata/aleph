from aleph.model import Role


def check_visible(role, authz):
    """Users should not see group roles which they are not a part of."""
    if authz.is_admin or role.id in authz.roles:
        return True
    return role.type == Role.USER


def check_editable(role, authz):
    """Check if a role can be edited by the current user."""
    if authz.is_admin:
        return True
    return role.id == authz.id
