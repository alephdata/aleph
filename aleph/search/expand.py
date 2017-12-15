from banal import ensure_list

from aleph.core import es
from aleph.model import Role
from aleph.index.core import entities_index, collections_index
from aleph.index.util import unpack_result

# Document (collection_id) -> Collection collection
# Document (uploader_id) -> Role uploader
# Entity (collection_id) -> Collection collection
# Document (parent.id) -> Document parent
# Entity (entities) -> Entity related
# Collection (creator.id) -> Role creator


class Expander(object):

    def __init__(self, field, target):
        self.field = field
        self.target = target

    def get_values(self, item):
        value = item.get(self.field)
        if isinstance(value, dict):
            value = value.get('id')
        return ensure_list(value)


class RoleExpander(Expander):

    def collect(self, result, item):
        if not hasattr(result, '_expand_roles'):
            result._expand_roles = set()
        result._expand_roles.update(self.get_values(item))

    def resolve(self, result):
        if not hasattr(result, '_expand_roles'):
            return {}
        if not hasattr(result, '_expanded_roles'):
            result._expanded_roles = {}
            for role in Role.all_by_ids(result._expand_roles, deleted=True):
                result._expand_roles[role.id] = role
        return result._expanded_index

    def apply(self, result, item):
        roles = self.resolve(result)
        for value in self.get_values(item):
            item.pop(self.field, None)
            role = roles.get(value)
            if role is not None:
                item[self.target] = role


class IndexExpander(Expander):

    def collect(self, result, item):
        if not hasattr(result, '_expand_index'):
            result._expand_index = set()
        index = self.get_index()
        for value in self.get_values(item):
            # print "XXX", (index, str(value))
            result._expand_index.add((index, str(value)))

    def resolve(self, result):
        if not hasattr(result, '_expand_index'):
            return {}
        if not hasattr(result, '_expanded_index'):
            result._expanded_index = {}
            query = []
            for (index, value) in result._expand_index:
                query.append({
                    '_index': index,
                    '_doc': 'doc',
                    '_id': value
                })
                results = es.mget(body={'docs': query},
                                  _source_exclude=['text'])
                for doc in results['docs']:
                    doc = unpack_result(doc)
                    if doc is not None:
                        key = (index, doc.get('id'))
                        result._expanded_index[key] = doc
        return result._expanded_index

    def apply(self, result, item):
        index = self.get_index()
        objects = self.resolve(result)
        for value in self.get_values(item):
            item.pop(self.field, None)
            obj = objects.get((index, str(value)))
            if obj is not None:
                item[self.target] = obj


class DocumentExpander(IndexExpander):

    def get_index(self):
        return entities_index()


class EntitiesExpander(IndexExpander):

    def get_index(self):
        return entities_index()


class CollectionExpander(IndexExpander):

    def get_index(self):
        return collections_index()
