from aleph.model.role import Role
from aleph.model.alert import Alert
from aleph.model.entity import Entity
from aleph.model.document import Document
from aleph.model.collection import Collection
from aleph.model.common import EventsEnum


class Events(EventsEnum):

    # UPDATE COLLECTION (collection)
    UPDATE_COLLECTION = {
        'template': '{{actor}} changed the settings of {{collection}}.',
        'params': {
            'collection': Collection
        }
    }

    # UPLOAD DOCUMENT (document)
    INGEST_DOCUMENT = {
        'template': '{{actor}} uploaded {{document}} to {{collection}}.',
        'params': {
            'document': Document,
            'collection': Collection
        }
    }

    # ALERT MATCH (entity)
    MATCH_ALERT = {
        'template': '{{entity}} matches your alert for {{alert}}.',
        'params': {
            'entity': Entity,
            'alert': Alert
        }
    }

    # GRANT COLLECTION (collection, role)
    GRANT_COLLECTION = {
        'template': '{{actor}} gave {{role}} access to {{collection}}.',
        'params': {
            'collection': Collection,
            'role': Role
        }
    }

    # PUBLISH COLLECTION (collection)
    PUBLISH_COLLECTION = {
        'template': '{{actor}} published {{collection}}.',
        'params': {
            'collection': Collection
        }
    }

    # REVOKE COLLECTION (collection, role)
    REVOKE_COLLECTION = {
        'template': '{{actor}} removed access to {{collection}} from {{role}}.',  # noqa
        'params': {
            'collection': Collection,
            'role': Role
        }
    }
