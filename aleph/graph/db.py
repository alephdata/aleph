import logging
from py2neo import Graph
from flask import current_app

from aleph.core import get_config

log = logging.getLogger(__name__)


class Vocab(object):
    Entity = 'Entity'
    Phone = 'Phone'
    Email = 'Email'
    Document = 'Document'
    Collection = 'Collection'

    LOCATED_AT = 'LOCATED_AT'
    CONTACT_FOR = 'CONTACT_FOR'
    MENTIONS = 'MENTIONS'
    CONTAINS = 'CONTAINS'
    AKA = 'AKA'


def get_graph():
    app = current_app._get_current_object()
    if not hasattr(app, '_neo4j_instance'):
        password = get_config('NEO4J_PASSWORD', 'neo4j')
        app._neo4j_instance = Graph(host=get_config('NEO4J_HOST'),
                                    user=get_config('NEO4J_USER', 'neo4j'),
                                    password=password)
        log.info("Connected to Neo4J graph.")
    return app._neo4j_instance


def ensure_index(label, prop):
    schema = get_graph().schema
    indices = schema.get_indexes(label)
    if prop not in indices:
        log.info("Creating index: %s (%s)", label, prop)
        schema.create_index(label, prop)
