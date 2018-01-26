from banal import ensure_list, first
from marshmallow import Schema, post_dump

from aleph.core import es
from aleph.model import Role, Document, Entity, Collection
from aleph.index.core import entities_index, collections_index
from aleph.index.util import unpack_result


class ExpandableSchema(Schema):
    EXPAND = []

    def _get_values(self, obj, field):
        value = obj.get(field)
        if isinstance(value, dict):
            value = value.get('id')

        return [str(v) for v in ensure_list(value)]

    def _type_dispatch(self, type_):
        if type_ in [Collection]:
            return collections_index()
        if type_ in [Document, Entity]:
            return entities_index()
        return type_

    def _resolve_roles(self, cache):
        roles = set()
        for (type_, id_) in cache.keys():
            if type_ == Role:
                roles.add(id_)
        if not len(roles):
            return
        for role in Role.all_by_ids(roles, deleted=True):
            cache[(Role, str(role.id))] = role

    def _resolve_index(self, cache):
        query = []
        for (type_, id_) in cache.keys():
            if type_ == Role:
                continue
            query.append({
                '_index': type_,
                '_id': id_
            })

        if not len(query):
            return

        results = es.mget(body={'docs': query},
                          _source_exclude=['text'])
        for doc in results['docs']:
            cache[(doc['_index'], doc['_id'])] = unpack_result(doc)

    @post_dump(pass_many=True)
    def expand(self, objs, many=False):
        cache = {}
        for obj in ensure_list(objs):
            for (field, type_, _, _, _) in self.EXPAND:
                type_ = self._type_dispatch(type_)
                for key in self._get_values(obj, field):
                    cache[(type_, key)] = None

        self._resolve_roles(cache)
        self._resolve_index(cache)

        for obj in ensure_list(objs):
            for (field, type_, target, schema, multi) in self.EXPAND:
                value = []
                type_ = self._type_dispatch(type_)
                for key in self._get_values(obj, field):
                    value.append(cache.get((type_, key)))

                if not multi:
                    value = first(value)

                obj.pop(field, None)
                if value is not None:
                    value, _ = schema().dump(value, many=multi)
                    obj[target] = value
