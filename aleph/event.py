import sys
import json
import traceback

from aleph.core import db, celery
from aleph import signals
from aleph.model import Event


@celery.task()
def store_report(origin, data):
    data = json.loads(data)
    signals.report_event.send(origin=origin, data=data)
    event = Event()
    event.origin = origin
    event.data = data
    db.session.add(event)
    db.session.commit()


def report(origin, data):
    data = json.dumps(data)
    store_report.delay(origin, data)


def exception(origin, data, exception):
    (error_type, error_message, error_details) = sys.exc_info()
    if error_type is not None:
        data['error_type'] = error_type.__name__
        data['error_message'] = unicode(error_message)
        data['error_details'] = traceback.format_exc()
    report(origin, data)
