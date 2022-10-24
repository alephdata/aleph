---
description: >-
  Aleph can do more than just keyword search. This page explains some of the
  more advanced queries supported by the system, such as fuzzy search and
  boolean queries.
---

# Search guide

Aleph stores a large number of documents from a variety of sources. In order to find the exact material you need, you may want to make use of some of its advanced search operators.

{% embed url="https://www.youtube.com/watch?v=Oolv25lo98w" %}



_You can also check the documentation of the_ [_search engine we are using, ElasticSearch_](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-query-string-query.html#query-string-syntax)_._

### Advanced Search Operators

To find **exact matches** for a given search term, e.g. to search for a person or company, try putting the name in quotes:

```text
"Barack Obama"
```

#### Proximity Searches

If you do not want to find a precise string, but merely specify that two words are supposed to appear close to each other, you might want to use **proximity search**. This will try to find all the requested search terms within a given distance from each other:

```text
"Bank America"~2
```

This will find relevant matches with the terms "Bank" and "America" occurring within two words from each other, such as "Bank of America", "Bank in America", even "America has a Bank".

#### Spelling Errors

The same principle of proximity can also be applied inside of individual words. A search will then try to find not just the precise word you've specified, but also **spelling variants**. A spelling variant is defined by the number of spelling mistakes that must be made to get from the original word to the variant.

```text
Wladimir~2
```

This will find not just the term "Wladimir", but also similar words such as "Vladimir", "Wladimyr" or "Vladimyr". Note that if you set the permissible distance too high, you will get very slow searches and many false results.

#### Composite queries

You can make queries composed of multiple terms in various ways. The simplest form is to just put more than one word into the search bar. In this case, Aleph will try and find documents that contain all of the given terms and put these first. After that, results that miss any of the given search terms will also be shown.

If you want to make sure that a given term must show up in the results \(or may never show up\), you can put a plus sign \("+"\) in front of it \(or a minus sign, "-", to make sure all documents with the given word are removed\).

```text
banana -ice -cream +fruit
```

You can also make more complex, boolean queries in which the terms "OR" and "AND" are used to specify the that certain search terms must appear together \(or can serve as alternatives to each other\).

```text
banana AND ("ice cream" OR gelato)
```

