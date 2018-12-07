# entityextractor

This is a simple gRPC service to manage the extraction of named entities
from text using one of several open source tools. The main reason for
having this run in a service is to avoid inlining the required training
data and Python dependencies in the main aleph application.

## NER options

* https://github.com/zalandoresearch/flair
* https://github.com/aboSamoor/polyglot
* https://spacy.io/

### Golang

* https://github.com/sbl/ner
* https://github.com/jdkato/prose

### Java

cf. https://github.com/ICIJ/datashare/tree/master/datashare-nlp
