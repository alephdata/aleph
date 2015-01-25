import logging
from pyelasticsearch.exceptions import ElasticHttpNotFoundError

from storyweb.core import es, es_index, db
from storyweb.util import AppEncoder
from storyweb.model.card import Card
from storyweb.search.mapping import CARD_MAPPING
from storyweb.search.result_proxy import ESResultProxy
from storyweb.search.queries import cards_query # noqa

log = logging.getLogger(__name__)


def init_search():
    try:
        es.delete_index(es_index)
    except ElasticHttpNotFoundError:
        pass
    es.create_index(es_index)
    log.info("Creating ElasticSearch index and uploading mapping...")
    es.put_mapping(es_index, Card.doc_type, {Card.doc_type: CARD_MAPPING})


def index_card(card):
    es.json_encoder = AppEncoder
    body = card.to_index()
    es.index(es_index, Card.doc_type, body, card.id)


def reindex():
    cards = db.session.query(Card)
    cards = cards.order_by(Card.created_at.desc())
    for card in cards.yield_per(500):
        log.info("Indexing %r", card)
        index_card(card)
    es.refresh(index=es_index)


def search_cards(query):
    return ESResultProxy(Card.doc_type, query)
