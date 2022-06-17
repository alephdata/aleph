# SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
# SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
#
# SPDX-License-Identifier: MIT

from banal import ensure_list
from rdflib import Namespace, ConjunctiveGraph, URIRef, Literal
from rdflib.namespace import FOAF, DC, RDF, RDFS, SKOS
from followthemoney import model
from pprint import pprint

from elasticsearch import Elasticsearch
from elasticsearch.helpers import scan

es = Elasticsearch()
collection_index = "aleph-collection-v1"
entity_index = "aleph-entity-v1"

HOST = "https://data.occrp.org"
ALEPH = Namespace("%s/#/ns/" % HOST)
FTM = Namespace("urn:ftm:")
SCHEMA = Namespace("%s/#/ftm/" % HOST)


def export_entity(ctx, entity):
    g = ConjunctiveGraph()
    if "Document" in entity["schemata"]:
        uri = URIRef("%s/documents/%s" % (HOST, entity["id"]))
        if entity.get("title"):
            g.add((uri, DC.title, Literal(entity.get("title")), ctx))
        g.add((uri, ALEPH.fileName, Literal(entity.get("file_name")), ctx))
        g.add((uri, ALEPH.mimeType, Literal(entity.get("mime_type")), ctx))
        # TODO DC dates, author etc.
        # parent
    else:
        uri = URIRef("%s/entities/%s" % (HOST, entity["id"]))
        if entity.get("name"):
            g.add((uri, SKOS.prefLabel, Literal(entity.get("name")), ctx))
        for name in entity.get("names", []):
            g.add((uri, RDFS.label, Literal(name), ctx))

    for schema in entity["schemata"]:
        g.add((uri, RDF.type, FTM[schema], ctx))

    for country in entity.get("countries", []):
        if len(country) != 2:
            continue
        country = URIRef("iso-3166-1:%s" % country)
        g.add((uri, ALEPH.country, country, ctx))

    for phone in entity.get("phones", []):
        phone = URIRef("tel:%s" % phone)
        g.add((uri, ALEPH.phone, phone, ctx))

    for email in entity.get("emails", []):
        email = URIRef("mailto:%s" % email)
        g.add((uri, ALEPH.email, email, ctx))

    schema = model[entity["schema"]]
    properties = entity.get("properties", {})
    for name, values in properties.items():
        prop = schema.get(name)
        pred = "%s#%s" % (prop.schema.name, name)
        pred = FTM[pred]
        for value in ensure_list(values):
            g.add((uri, pred, Literal(value), ctx))

    print g.serialize(format="nquads")


def export_collection(collection):
    g = ConjunctiveGraph()
    domain = URIRef(HOST)
    ctx = URIRef("%s/collections/%s" % (HOST, collection["id"]))
    g.add((ctx, RDFS.label, Literal(collection["label"]), domain))
    g.add((ctx, ALEPH.foreignId, Literal(collection["foreign_id"]), domain))
    # print g.serialize(format='nquads')
    # pprint(collection)

    q = {
        "query": {"term": {"collection_id": collection["id"]}},
        "_source": {"exclude": ["text"]},
    }
    for row in scan(es, index=entity_index, query=q):
        entity = row["_source"]
        entity["id"] = row["_id"]
        export_entity(ctx, entity)


def export_collections():
    q = {"query": {"match_all": {}}, "size": 9999}
    res = es.search(index=collection_index, body=q)
    for hit in res["hits"]["hits"]:
        collection = hit["_source"]
        collection["id"] = hit["_id"]
        export_collection(collection)


if __name__ == "__main__":
    export_collections()
