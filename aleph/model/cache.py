from aleph.core import db


class Cache(db.Model):
    """Store OCR computation results."""
    __tablename__ = 'cache'

    id = db.Column(db.BigInteger, primary_key=True)
    key = db.Column(db.Unicode, index=True)
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
        session = db.sessionmaker(bind=db.engine)()
        cobj = cls()
        cobj.key = key
        cobj.value = value
        session.add(cobj)
        session.commit()

    def __repr__(self):
        return '<Cache(%r)>' % self.key

    def __unicode__(self):
        return self.key
