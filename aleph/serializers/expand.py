import logging
from banal import ensure_list, first
from marshmallow import Schema, post_dump

from aleph.core import es
from aleph.model import Role, Document, Entity, Collection
from aleph.index.core import entities_index_list, collections_index
from aleph.index.util import unpack_result

log = logging.getLogger(__name__)


class ExpandableSchema(Schema):
    EXPAND = []

    def _get_values(self, obj, field):
        value = obj.get(field)
        if isinstance(value, dict):
            value = value.get('id')
        return [str(v) for v in ensure_list(value)]

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
        queries = []
        for (type_, id_) in cache.keys():
            if type_ in [Collection]:
                index = collections_index()
                query = {'_index': index, '_id': id_}
                queries.append(((type_, id_), query))
            elif type_ in [Document, Entity]:
                for index in entities_index_list():
                    query = {'_index': index, '_id': id_}
                    queries.append(((type_, id_), query))

        if not len(queries):
            return

        results = es.mget(body={'docs': [q[1] for q in queries]},
                          _source_exclude=['text'])
        for (key, _), doc in zip(queries, results['docs']):
            doc = unpack_result(doc)
            if cache.get(key) is None and doc is not None:
                cache[key] = doc

    @post_dump(pass_many=True)
    def expand(self, objs, many=False):
        cache = {}
        for obj in ensure_list(objs):
            for (field, type_, _, _, _) in self.EXPAND:
                for key in self._get_values(obj, field):
                    cache[(type_, key)] = None

        self._resolve_roles(cache)
        self._resolve_index(cache)

        for obj in ensure_list(objs):
            for (field, type_, target, schema, multi) in self.EXPAND:
                value = []
                for key in self._get_values(obj, field):
                    value.append(cache.get((type_, key)))

                if not multi:
                    value = first(value)

                obj.pop(field, None)
                if value is not None:
                    value, _ = schema().dump(value, many=multi)
                    obj[target] = value
