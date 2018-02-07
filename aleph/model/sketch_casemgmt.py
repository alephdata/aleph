from aleph.core import db
from aleph.model.collection import Collection


class Case(Collection):
    """A case is a type of collection which is used to manage the state
    of an investigation. Unlike normal collections, cases do not serve
    as source material, but as a mechanism of analysis.
    """
    CATEGORY = 'case'


class Source(Collection):
    """POSSIBLE EXTENSION
    A source is a type of collection which is managed by the system and
    cannot receive user-uploaded documents. It is used for bulk data 
    loads and crawled data. 

    [ Could also just keep calling this a "Collection". ]
    """
    pass


class Dossier(db.Model):
    # extends entity? common base class?

    # schema
    # data
    # id (uuid)
    # published [b]

    # index fields:
    # - collection_id (multi)
    # - included (multi entity_id)
    # - excluded (multi entity_id)
    # - roles
    pass


class Link(db.Model):
    # names: Inclusion, Involvement, Relevance

    # dossier_id
    # case_id
    # summary
    pass


class Merge(db.Model):
    # names: Component, Identity, SameAs

    # entity_id
    # dossier_id
    # decision [b]
    # decided [b] - ??
    # score
    # generator - ??
    # generated [b] - ??
    # created_at
    # deleted_at
    pass
