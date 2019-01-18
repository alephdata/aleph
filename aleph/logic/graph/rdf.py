import logging
from followthemoney.types import registry
from rdflib import Namespace, Graph, URIRef, Literal
from rdflib.namespace import DCTERMS, RDF, RDFS, SKOS

from aleph.index.entities import iter_proxies
from aleph.logic.util import ui_url

DCMI = Namespace('http://purl.org/dc/dcmitype/')
ALEPH = Namespace('https://schema.alephdata.org/terms#')

log = logging.getLogger(__name__)


def itergraph(graph):
    nt = graph.serialize(format='nt')
    for line in nt.splitlines():
        if len(line):
            yield line
            yield b'\n'


def export_entity(entity, collection_uri):
    g = Graph()
    uri = registry.entity.rdf(entity.id)
    g.add((uri, DCTERMS.isPartOf, collection_uri))
    g.add((collection_uri, DCTERMS.hasPart, uri))
    if entity.caption:
        g.add((uri, SKOS.prefLabel, Literal(entity.caption)))
    for stmt in entity.statements:
        triple = stmt.rdf()
        if triple is not None:
            g.add(triple)
    return g


def export_collection(collection):
    uri = URIRef(ui_url('collections', collection.id))
    g = Graph()
    g.add((uri, RDF.type, DCMI.Collection))
    g.add((uri, RDFS.label, Literal(collection.label)))
    g.add((uri, DCMI.identifier, Literal(collection.foreign_id)))
    g.add((uri, ALEPH.category, ALEPH[collection.category]))
    yield from itergraph(g)
    for entity in iter_proxies(collection_id=collection.id):
        yield from itergraph(export_entity(entity, uri))
