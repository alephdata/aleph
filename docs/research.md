# Research topics

Topics in need of more research.

## Domain model ideas

* Each imported document is either tabular or textual. It has many records,
  i.e. data rows or document pages.
* An entity (such as a person, organisation, or topic) is like a permanent
  search query; each entity can have multiple actual search terms associated
  with it (`selectors`).
* Documents matching an entity after that entity has been created yield
  notifications if a user is subscribed.

## Decentralized pipeline ideas

The idea is to pick various subsets of functionality out of a larger continuum
of possible tasks related to document and data processing and try to modularise
or separate to components and stages of the processing pipelines. This way
these could become re-usable while deployed in the differing contexts of the
various tools.

Related:

* [Centipede](https://github.com/opennewslabs/centipede)

## Open design questions

### Entity graph model

The idea is about making a formal instead of a (i.e.) corporate graph. Let's
make a messy one that has all the attributes we can derive from our internal
data structure. Then let's use it as a recommendation engine, rather than an
academic research object :)

#### Authorisation

Making sure that users can only see the parts of the graph to which they have
explicit access is the hardest part of this. Every node in the graph needs to
be associated with one or many collections, and every user querying the
database has access to several hundred collections. The following are options
for modelling this:

* Make each `Collection` a node and connect it to all its subjects using
  `PART_OF` relationships. Query these links at the same time as the actual
  data.
* Add labels to each node to express the `Collections` that it belongs to.
  This fails because it is impossible to do an OR search on node labels in
  Neo4J.

**Neo4J Lead Generation Patterns**

```cypher
MATCH (c:Collection)<-[:PART_OF]-(src)
MATCH pth = (src)-[*1..3]-(dest)
MATCH (nc:Collection)
WHERE
    all(n IN nodes(pth) WHERE (n)<-[:PART_OF]-(nc))
    AND nc.id IN [250]
RETURN src, pth, dest
LIMIT 10;
```

```cypher
MATCH (c:Collection)<-[:PART_OF]-(src)
MATCH pth = (src)-[*1..3]-(dest)
MATCH (nc:Collection)

    all(n IN nodes(pth) WHERE (n)<-[:PART_OF]-(nc))
RETURN pth
LIMIT 10;
```

```cypher
MATCH (c:Collection)<-[:PART_OF]-(src)
MATCH pth = (src)-[*1..3]-(dest)
MATCH (nc:Collection)
WHERE
    c.alephCollection = 250
    AND nc.alephCollection IN [250, 39]
    AND all(n IN nodes(pth) WHERE (n)<-[:PART_OF]-(nc))
RETURN pth
LIMIT 10;
```

#### Model ideas

* Actor (actorName, actorFingerprint, actorLegalEntity, actorCompany, actorPerson)
  * UNDER_JURISDICTION Country
  * PART_OF Collection
  * LOCATED_AT Address
  * REACHABLE_AT PhoneNumber
  * REACHABLE_AT EMail
  * AUTHORED Document
  * BORN_AT Date
  * DIED_AT Date
  * FOUNDED_AT Date
  * DISSOLVED_AT Date
* Country (countryName, countryCode)
* Collection (collectionId, collectionName)
* Document (documentTitle, documentId, documentType)
  * MENTIONS Actor
  * MENTIONS PhoneNumber
  * MENTIONS EMail
  * PART_OF Collection
  * MENTIONS Date
* PhoneNumber (phoneNumber)
  * LOCATED_IN Country
* Address (addressText)
  * LOCATED_IN Country
* EMail (emailAddress)
  * LOCATED_IN Country
* Date (yearMonthDay)


#### Indexing notes

Neo4J queries can go from instantaneous to horrible based on the existance of
an index, much quicker than Postgres. Here's the current indexing strategy:

```
MERGE (n) SET n:Aleph;
MERGE (n:Collection) REMOVE n:Aleph;

DROP INDEX ON :Entity(id);
DROP INDEX ON :Phone(id);
DROP INDEX ON :Email(id);
DROP INDEX ON :Document(id);
DROP INDEX ON :Address(id);

DROP INDEX ON :Entity(fingerprint);
DROP INDEX ON :Phone(fingerprint);
DROP INDEX ON :Email(fingerprint);
DROP INDEX ON :Document(fingerprint);
DROP INDEX ON :Address(fingerprint);

CREATE CONSTRAINT ON (n:Aleph) ASSERT n.id IS UNIQUE;
CREATE INDEX ON :Aleph(fingerprint);
```
