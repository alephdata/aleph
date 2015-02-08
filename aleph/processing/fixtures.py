import os
import logging
import yaml
import unicodecsv
from collections import defaultdict

from colander import Invalid

from aleph.core import db
from aleph.model.forms import CATEGORIES
from aleph.model import List, Entity
from aleph.processing.entities import refresh

log = logging.getLogger(__name__)
fixtures_path = os.path.join(os.path.dirname(__file__), '..', '..', 'data',
                             'list_fixtures')


def load_fixture(name):
    dir_name = os.path.join(fixtures_path, name)
    if not os.path.isdir(dir_name):
        raise ValueError("No such directory: %r" % dir_name)

    with open(os.path.join(dir_name, 'mapping.yaml'), 'rb') as fh:
        data = yaml.load(fh)

    lst = List.by_label(data.get('list'))
    selectors = set()
    if lst is not None:
        selectors = lst.terms
        lst.delete()
        db.session.commit()

    lst = List.create({
        'label': data.get('list'),
        'public': data.get('public'),
        'users': []
    }, None)
    log.info("Loading %r", lst)

    mapping = data.get('mapping')
    default_category = data.get('default_category')
    assert default_category in CATEGORIES, default_category

    entities = defaultdict(set)
    with open(os.path.join(dir_name, 'data.csv'), 'rb') as fh:
        for row in unicodecsv.DictReader(fh):
            label = row.get(mapping.get('label', 'label'))
            if label is None:
                continue

            category = row.get(mapping.get('category', 'category'))
            category = category or default_category

            selectors = [row.get(mapping.get('selector', 'selector'))]
            selectors = [s for s in selectors if s]
            entities[(label, category)].update(selectors)

    for (label, category), selectors in entities.items():
        data = {'label': label, 'category': category,
                'selectors': selectors, 'list': lst}
        try:
            Entity.create(data, None)
        except Invalid, inv:
            log.warn("Failed: %s", inv)

    db.session.commit()
    selectors.update(lst.terms)
    log.info('Created %s entities', len(entities))
    refresh(selectors)
