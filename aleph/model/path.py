import logging
from sqlalchemy import func, cast
from sqlalchemy.dialects.postgresql import JSONB, ARRAY

from aleph.core import db
from aleph.model.common import IdModel
from aleph.model.collection import Collection
from aleph.model.entity import collection_entity_table

log = logging.getLogger(__name__)


class Path(db.Model, IdModel):
    data = db.Column(JSONB)
    length = db.Column(db.Integer())
    labels = db.Column(ARRAY(db.Unicode()))
    types = db.Column(ARRAY(db.Unicode()))
    start_entity_id = db.Column(db.String(32), db.ForeignKey('entity.id'), index=True)  # noqa
    end_collection_id = db.Column(db.Integer(), db.ForeignKey('collection.id'), index=True)  # noqa

    @classmethod
    def from_data(cls, start_entity, end_collection_id, nodes, edges):
        obj = cls()
        obj.start_entity_id = start_entity.id
        obj.end_collection_id = end_collection_id
        obj.length = len(edges)
        obj.labels = list(set([n['$label'] for n in nodes]))
        obj.types = list(set([e['$type'] for e in edges]))
        obj.data = {
            'nodes': nodes,
            'edges': edges
        }
        db.session.add(obj)
        return obj

    def to_dict(self):
        return self.data

    @classmethod
    def delete_by_entity(cls, start_entity_id):
        q = db.session.query(cls)
        q = q.filter(cls.start_entity_id == start_entity_id)
        q.delete()

    @classmethod
    def filters(cls, q, start_collection, start_entity_id=None,
                end_collection_id=[], end_cet=None, labels=[], types=[]):
        if start_entity_id is not None:
            q = q.filter(cls.start_entity_id == start_entity_id)
        else:
            cet = collection_entity_table.alias()
            q = q.join(cet, cet.c.entity_id == cls.start_entity_id)
            q = q.filter(cet.c.collection_id == start_collection.id)
        q = q.filter(cls.end_collection_id.in_(end_collection_id))
        if len(labels):
            labels = cast(labels, ARRAY(db.Unicode()))
            q = q.filter(cls.labels.contained_by(labels))
        if len(types):
            types = cast(types, ARRAY(db.Unicode()))
            q = q.filter(cls.types.contained_by(types))
        return q

    @classmethod
    def facet_values(cls, q, fld, cnt):
        q = q.group_by(fld)
        q = q.order_by(cnt.desc())
        return [{'value': v, 'count': c} for v, c in q]

    @classmethod
    def facets(cls, start_collection, start_entity_id=None,
               end_collection_id=[], labels=[], types=[],
               collection_id=[]):
        collection_id = [c for c in collection_id if c != start_collection.id]
        end_collection_id = [c for c in end_collection_id
                             if c != start_collection.id]
        facets = {}
        # SELECT unnest(labels), COUNT(unnest(labels))
        #    FROM path GROUP BY unnest(labels);
        labels_fld = func.unnest(cls.labels)
        labels_cnt = func.count(labels_fld)
        q = db.session.query(labels_fld, labels_cnt)
        q = cls.filters(q, start_collection, start_entity_id=start_entity_id,
                        end_collection_id=end_collection_id, types=types)
        facets['label'] = cls.facet_values(q, labels_fld, labels_cnt)

        # SELECT unnest(types), COUNT(unnest(types))
        #    FROM path GROUP BY unnest(types);
        types_fld = func.unnest(cls.types)
        types_cnt = func.count(types_fld)
        q = db.session.query(types_fld, types_cnt)
        q = cls.filters(q, start_collection, start_entity_id=start_entity_id,
                        end_collection_id=end_collection_id, labels=labels)
        facets['type'] = cls.facet_values(q, types_fld, types_cnt)

        # this is more complex, facet by collection:
        collections_fld = cls.end_collection_id
        collections_cnt = func.count(cls.id)
        q = db.session.query(collections_fld, Collection.label,
                             collections_cnt)
        q = q.select_from(cls)
        q = cls.filters(q, start_collection, start_entity_id=start_entity_id,
                        end_collection_id=collection_id, labels=labels,
                        types=types)
        q = q.join(Collection, Collection.id == collections_fld)
        q = q.group_by(collections_fld, Collection.label)
        q = q.order_by(collections_cnt.desc())
        cs = [{'value': v, 'label': l, 'count': c} for v, l, c in q]
        facets['collection_id'] = cs
        return facets

    @classmethod
    def find(cls, start_collection, start_entity_id=None,
             end_collection_id=[], labels=[], types=[]):
        q = db.session.query(cls)
        q = cls.filters(q, start_collection, start_entity_id=start_entity_id,
                        end_collection_id=end_collection_id, labels=labels,
                        types=types)
        return q

    def __repr__(self):
        return '<Path(%r, %r, %r)>' % (self.id, self.entity_id, self.length)
