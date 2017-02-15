from sqlalchemy import func
from sqlalchemy.dialects.postgresql import ARRAY


class ModelFacets(object):

    @classmethod
    def facet_by(cls, q, field, filter_null=False):
        if isinstance(field.property.columns[0].type, ARRAY):
            field = func.unnest(field)
        cnt = func.count(field)
        q = q.from_self(field, cnt)
        q = q.group_by(field)
        q = q.order_by(cnt.desc())
        return [{'value': v, 'count': c} for v, c in q if v is not None]
