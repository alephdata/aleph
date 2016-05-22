from datetime import datetime
from hashlib import sha1

from aleph.core import db


class Cache(db.Model):
    """Store OCR computation results."""

    id = db.Column(db.BigInteger, primary_key=True)
    key = db.Column(db.Unicode, index=True)
    value = db.Column(db.Unicode)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    @classmethod
    def get_ocr_key(cls, data, languages):
        key = sha1(data)
        key.update(languages)
        return key.hexdigest()

    @classmethod
    def get_ocr(cls, data, languages):
        q = db.session.query(cls.value)
        q = q.filter_by(key=cls.get_ocr_key(data, languages))
        q = q.order_by(cls.created_at.desc())
        cobj = q.first()
        if cobj is not None:
            return cobj.value

    @classmethod
    def set_ocr(cls, data, languages, value):
        session = db.sessionmaker(bind=db.engine)()
        cobj = cls()
        cobj.key = cls.get_ocr_key(data, languages)
        cobj.value = value
        session.add(cobj)
        session.commit()

    def __repr__(self):
        return '<Cache(%r)>' % self.key

    def __unicode__(self):
        return self.key
