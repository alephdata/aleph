from aleph.core import db


class Cache(db.Model):
    """Store OCR computation results."""
    __tablename__ = 'cache'

    key = db.Column(db.Unicode, primary_key=True)
    value = db.Column(db.Unicode)

    @classmethod
    def get_cache(cls, key):
        q = db.session.query(cls.value)
        q = q.filter_by(key=key)
        cobj = q.first()
        if cobj is not None:
            return cobj.value

    @classmethod
    def set_cache(cls, key, value):
        cobj = cls()
        cobj.key = key
        cobj.value = value
        db.session.add(cobj)

    def __repr__(self):
        return '<Cache(%r)>' % self.key

    def __unicode__(self):
        return self.key
