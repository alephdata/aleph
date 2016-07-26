from aleph.graph.db import Vocab, ensure_index
from aleph.graph.collections import load_collections  # noqa
from aleph.graph.entities import load_entities  # noqa
from aleph.graph.documents import load_documents  # noqa


def upgrade():
    ensure_index(Vocab.Collection, 'alephCollection')
    ensure_index(Vocab.Entity, 'fingerprint')
    ensure_index(Vocab.Entity, 'alephEntity')
    ensure_index(Vocab.Document, 'alephDocument')
    ensure_index(Vocab.Phone, 'fingerprint')
    ensure_index(Vocab.Email, 'fingerprint')
