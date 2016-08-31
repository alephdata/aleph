import logging
from sqlalchemy import func, cast, not_
from sqlalchemy.dialects.postgresql import JSONB, ARRAY

from aleph.core import db
from aleph.util import unwind
from aleph.model.common import IdModel
from aleph.model.collection import Collection
from aleph.model.entity import collection_entity_table

log = logging.getLogger(__name__)


class Path(db.Model, IdModel):
    start_entity_id = db.Column(db.String(32),
                                db.ForeignKey('entity.id'), index=True)  # noqa
    data = db.Column(JSONB)
    length = db.Column(db.Integer())
    weight = db.Column(db.Integer())
    labels = db.Column(ARRAY(db.Unicode()))
    types = db.Column(ARRAY(db.Unicode()))
    end_collection_id = db.Column(ARRAY(db.Integer()))

    @classmethod
    def from_data(cls, start_entity, end_collection_id, paths, types,
                  labels, start, end):
        obj = cls()
        obj.start_entity_id = start_entity.id
        obj.end_collection_id = end_collection_id

        obj.labels = unwind(labels)
        obj.types = unwind(types)

        lengths = map(len, paths)
        obj.length = min(lengths) - 1
        average = float(sum(lengths)) / float(len(lengths))
        obj.weight = len(paths) * (1.0 / max(1.0, average))
        obj.data = {
            'start': start,
            'end': end,
            'paths': paths
        }
        db.session.add(obj)
        return obj

    def to_dict(self):
        return {
            'start': self.data['start'],
            'end': self.data['end'],
            'length': self.length,
            'types': self.types,
            'labels': self.labels,
            'start_entity_id': self.start_entity_id,
            'end_collection_id': self.end_collection_id,
            'nodes': unwind(self.data['paths']),
        }

    @classmethod
    def delete_by_entity(cls, start_entity_id):
        q = db.session.query(cls)
        q = q.filter(cls.start_entity_id == start_entity_id)
        q.delete()

    @classmethod
    def filters(cls, q, start_collection, start_entity_id=None,
                end_collection_id=[], labels=[], types=[]):
        if start_entity_id is not None:
            q = q.filter(cls.start_entity_id == start_entity_id)
        else:
            cet = collection_entity_table.alias()
            q = q.join(cet, cet.c.entity_id == cls.start_entity_id)
            q = q.filter(cet.c.collection_id == start_collection.id)
        q = q.filter(cls.end_collection_id.overlap(end_collection_id))
        pred = not_(cls.end_collection_id.contains([start_collection.id]))
        q = q.filter(pred)
        if len(labels):
            labels = cast(labels, ARRAY(db.Unicode()))
            q = q.filter(cls.labels.contained_by(labels))
        if len(types):
            types = cast(types, ARRAY(db.Unicode()))
            q = q.filter(cls.types.contained_by(types))
        return q

    @classmethod
    def facet_array(cls, field, start_collection, start_entity_id=None,
                    end_collection_id=[], labels=[], types=[]):
        """Facet over an array-typed column."""
        # SELECT unnest(labels), COUNT(unnest(labels))
        #    FROM path GROUP BY unnest(labels);
        field = func.unnest(field)
        field_cnt = func.count(field)
        q = db.session.query(field, field_cnt)
        q = cls.filters(q, start_collection, start_entity_id=start_entity_id,
                        end_collection_id=end_collection_id, types=types)
        q = q.group_by(field)
        q = q.order_by(field_cnt.desc())
        return [{'value': v, 'count': c} for v, c in q]

    @classmethod
    def facets(cls, start_collection, start_entity_id=None,
               end_collection_id=[], labels=[], types=[], collection_id=[]):
        facets = {}
        facets['label'] = cls.facet_array(cls.labels, start_collection,
                                          start_entity_id=start_entity_id,
                                          end_collection_id=end_collection_id,
                                          types=types)
        facets['type'] = cls.facet_array(cls.types, start_collection,
                                          start_entity_id=start_entity_id,
                                          end_collection_id=end_collection_id,
                                          labels=labels)
        collection_id = cls.facet_array(cls.end_collection_id, start_collection,
                                          start_entity_id=start_entity_id,
                                          end_collection_id=collection_id,
                                          labels=labels, types=types)
        objs = Collection.all_by_ids([f['value'] for f in collection_id])
        for facet in collection_id:
            for obj in objs:
                if facet['value'] == obj.id:
                    facet['label'] = obj.label
        facets['collection_id'] = collection_id
        return facets

    @classmethod
    def find(cls, start_collection, start_entity_id=None,
             end_collection_id=[], labels=[], types=[]):
        q = db.session.query(cls)
        q = cls.filters(q, start_collection, start_entity_id=start_entity_id,
                        end_collection_id=end_collection_id, labels=labels,
                        types=types)
        q = q.order_by(Path.weight.asc())
        return q

    def __repr__(self):
        return '<Path(%r, %r, %r)>' % (self.id, self.entity_id, self.length)
