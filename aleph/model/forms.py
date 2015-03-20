import colander
from normality import slugify
from colander import Invalid # noqa

PERSON = 'Person'
COMPANY = 'Company'
ORGANIZATION = 'Organization'
OTHER = 'Other'
CATEGORIES = [PERSON, COMPANY, ORGANIZATION, OTHER]


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


class ListRef(Ref):

    def decode(self, cstruct):
        from aleph.model.list import List

        if isinstance(cstruct, List):
            return cstruct
        if isinstance(cstruct, (basestring, int)):
            return List.by_id(cstruct)
        if isinstance(cstruct, dict):
            return self.decode(cstruct.get('id'))
        return None


class UserForm(colander.MappingSchema):
    email = colander.SchemaNode(colander.String(),
                                validator=colander.Email())
    display_name = colander.SchemaNode(colander.String())


class SourceUsers(colander.SequenceSchema):
    user = colander.SchemaNode(UserRef())


class SourceCrawlers(colander.OneOf):

    @property
    def choices(self):
        from aleph.crawlers import get_crawlers
        return get_crawlers().keys()

    @choices.setter
    def choices(self, value):
        pass


class SourceEditForm(colander.MappingSchema):
    label = colander.SchemaNode(colander.String())
    public = colander.SchemaNode(colander.Boolean())
    # crawler = colander.SchemaNode(colander.String(),
    #                               validator=SourceCrawlers([]))
    users = SourceUsers()
    config = colander.SchemaNode(colander.Mapping(unknown='preserve'))


def source_slug_available(value):
    from aleph.model.source import Source
    existing = Source.by_slug(value)
    return existing is None


class SourceCreateForm(colander.MappingSchema):
    slug = colander.SchemaNode(colander.String(),
        preparer=slugify,
        validator=colander.All(
            colander.Function(source_slug_available, 'Invalid slug'),
            colander.Length(min=3, max=100))) # noqa
    label = colander.SchemaNode(colander.String())
    crawler = colander.SchemaNode(colander.String(),
                                  validator=SourceCrawlers([]))
    users = SourceUsers(missing=[])
    config = colander.SchemaNode(colander.Mapping(unknown='preserve'))


class ListUsers(colander.SequenceSchema):
    user = colander.SchemaNode(UserRef())


class ListForm(colander.MappingSchema):
    label = colander.SchemaNode(colander.String())
    public = colander.SchemaNode(colander.Boolean())
    users = ListUsers()


class EntitySelectors(colander.SequenceSchema):
    selector = colander.SchemaNode(colander.String())


class EntityForm(colander.MappingSchema):
    label = colander.SchemaNode(colander.String())
    category = colander.SchemaNode(colander.String(),
                                   validator=colander.OneOf(CATEGORIES))
    selectors = EntitySelectors()
    list = colander.SchemaNode(ListRef())
