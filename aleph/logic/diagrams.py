import logging
from flask import render_template

from aleph import settings
from aleph.model import EntitySet
from aleph.index.entities import entities_by_ids

log = logging.getLogger(__name__)
FIELDS = ["id", "schema", "properties"]


def publish_diagram(entityset_id):
    entityset = EntitySet.by_id(entityset_id, types=[EntitySet.DIAGRAM])
    embed = render_diagram(entityset)
    with open(f"embed_{entityset_id}.html", "w") as fh:
        fh.write(embed)


def render_diagram(entityset):
    """Generate an HTML snippet from a diagram object."""
    entity_ids = entityset.entities
    entities = []
    for entity in entities_by_ids(entity_ids, cached=True):
        for field in list(entity.keys()):
            if field not in FIELDS:
                entity.pop(field)
        entities.append(entity)

    # TODO: add viewport
    return render_template(
        "diagram.html",
        data={
            "entities": entities,
            "layout": entityset.layout,
            "viewport": {"center": {"x": 0, "y": 0}},
        },
        entityset=entityset,
        settings=settings,
    )
