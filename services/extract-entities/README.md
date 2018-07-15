# entityextractor

Aleph entity extractor. It combines spaCy and Polyglot with the premise
that spaCy is higher-quality, and Polyglot has broader language support.

Stages:

* run spaCy, polyglot on the given text iterator.
* aggregate by name, and summarise by weight
* normalise the name
