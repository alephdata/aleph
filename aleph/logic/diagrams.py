import logging
from flask import render_template

from aleph import settings
from aleph.model import EntitySet
from aleph.index.entities import entities_by_ids

log = logging.getLogger(__name__)


def publish_diagram(entityset_id):
    entityset = EntitySet.by_id(entityset_id, types=[EntitySet.DIAGRAM])
    embed = render_diagram(entityset)
    with open(f"embed_{entityset_id}.html", "w") as fh:
        fh.write(embed)


def render_diagram(entityset):
    entity_ids = entityset.entities
    entities = list(entities_by_ids(entity_ids, cached=True))
    # TODO: add viewport
    return render_template(
        "diagram.html",
        data={"entities": entities, "layout": entityset.layout},
        entityset=entityset,
        settings=settings,
    )
