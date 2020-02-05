import logging
from banal import ensure_list
from countrytagger import tag_place


log = logging.getLogger(__name__)


def location_country(location):
    code, score, country = tag_place(location)
    return ensure_list(country)
