# SPDX-FileCopyrightText: 2014 2014 Emma Prest, <emma@occrp.org> et al.
#
# SPDX-License-Identifier: MIT

import dataset
from itertools import combinations
from unicodecsv import writer

db = dataset.connect("postgresql://localhost/aleph")
query = """
    SELECT d.id AS doc_id, a.text2 AS entity, SUM(dt.weight) AS weight
        FROM document_tag dt
            LEFT JOIN document d ON dt.document_id = d.id
            LEFT JOIN azura_names a ON LOWER(a.text) = LOWER(dt.text)
        WHERE d.collection_id = 3 AND a.text2 IS NOT NULL
        GROUP BY a.text2, d.id
        HAVING COUNT(d.id) > 1
        ORDER BY SUM(dt.weight) DESC;
"""

entities = {}
documents = {}

for res in db.query(query):
    doc_id, entity, weight = res.values()
    entities[entity] = weight
    if doc_id not in documents:
        documents[doc_id] = []
    documents[doc_id].append(entity)

links = {}
for doc_id, mentions in documents.items():
    for (a, b) in combinations(mentions, 2):
        link = (max(a, b), min(a, b))
        if link not in links:
            links[link] = 0
        links[link] += 1

with open("links.csv", "w") as fh:
    csv = writer(fh)
    csv.writerow(["source", "source_weight", "target", "target_weight", "weight"])
    for (a, b), weight in links.items():
        csv.writerow([a, entities.get(a), b, entities.get(b), weight])
