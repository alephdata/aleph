import logging

from followthemoney.namespace import Namespace


log = logging.getLogger(__name__)


def clean_report_payload(payload):
    if 'entity' not in payload:
        log.error(payload)
    # sign entity ids
    entity = payload['entity']
    if not isinstance(entity, dict):
        entity = entity.to_dict()
    ns = payload.pop('ns', None)
    if ns is None:
        ns = Namespace(payload['dataset'])
    entity['id'] = ns.sign(entity['id'])
    payload['entity'] = entity
    return payload
