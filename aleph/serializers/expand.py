from banal import ensure_list, first
from marshmallow import Schema, pre_dump

from aleph.core import db, es
from aleph.model import Role, Document, Entity, Collection
from aleph.index.core import entities_index, collections_index
from aleph.index.util import unpack_result


class ExpandableSchema(Schema):
    EXPAND = []

    def _get_values(self, obj, field):
        if isinstance(obj, dict):
            value = obj.get(field)
        else:
            value = getattr(obj, field)

        if isinstance(value, dict):
            value = value.get('id')
        elif isinstance(value, db.Model):
            value = getattr(value, 'id')

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
                '_doc': 'doc',
                '_id': id_
            })

        if not len(query):
            return

        results = es.mget(body={'docs': query},
                          _source_exclude=['text'])
        for doc in results['docs']:
            cache[(doc['_index'], doc['_id'])] = unpack_result(doc)

    @pre_dump(pass_many=True)
    def expand(self, objs, many=False):
        cache = {}
        objs = ensure_list(objs)
        for obj in objs:
            for (field, type_, _, _) in self.EXPAND:
                type_ = self._type_dispatch(type_)
                for key in self._get_values(obj, field):
                    cache[(type_, key)] = None

        self._resolve_roles(cache)
        self._resolve_index(cache)

        for obj in objs:
            for (field, type_, target, multi) in self.EXPAND:
                value = []
                type_ = self._type_dispatch(type_)
                for key in self._get_values(obj, field):
                    value.append(cache.get((type_, key)))
                if not multi:
                    value = first(value)

                if isinstance(obj, dict):
                    # obj.pop(field, None)
                    obj[target] = value
                else:
                    # setattr(obj, field, None)
                    setattr(obj, target, value)
