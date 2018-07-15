# entityextractor

Aleph entity extractor. It combines spaCy and Polyglot with the premise
that spaCy is higher-quality, and Polyglot has broader language support.

Stages:

* run spaCy, polyglot on the given text iterator.
* aggregate by name, and summarise by weight
* normalise the name

## Analysis

```sql
DROP MATERIALIZED VIEW frequent_tags;
CREATE MATERIALIZED VIEW frequent_tags AS (
    SELECT text, SUM(weight) AS weight, COUNT(*) AS mentions
        FROM document_tag
        WHERE origin IN ('polyglot', 'spacy')
        GROUP BY text
        HAVING SUM(weight) > 10
) WITH DATA;
```