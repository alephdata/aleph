import colander
from colander import Invalid # noqa


class Ref(object):

    def deserialize(self, node, cstruct):
        if cstruct is colander.null:
            return colander.null
        value = self.decode(cstruct)
        if value is None:
            raise colander.Invalid(node, 'Missing')
        return value

    def cstruct_children(self, node, cstruct):
        return []


class UserRef(Ref):

    def decode(self, cstruct):
        from aleph.model.user import User

        if isinstance(cstruct, User):
            return cstruct
        if isinstance(cstruct, (basestring, int)):
            return User.by_id(cstruct)
        if isinstance(cstruct, dict):
            return self.decode(cstruct.get('id'))
        return None


class UserForm(colander.MappingSchema):
    email = colander.SchemaNode(colander.String(),
                                validator=colander.Email())
    display_name = colander.SchemaNode(colander.String())


class CollectionUsers(colander.SequenceSchema):
    user = colander.SchemaNode(UserRef())


class CollectionForm(colander.MappingSchema):
    label = colander.SchemaNode(colander.String())
    public = colander.SchemaNode(colander.Boolean())
    users = CollectionUsers()

