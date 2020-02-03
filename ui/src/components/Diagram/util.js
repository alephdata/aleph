const replaceEntityIdInLayout = ({ layout, oldId, newId }) => ({
  vertices: layout.vertices.map(v => {
    if (v.entityId === oldId) {
      v.entityId = newId;
      v.id = `entity:${newId}`;
    }
    return v;
  }),
  edges: layout.edges,
  groupings: layout.groupings,
});

const createEntitiesFromDiagram = async ({ undeleteEntity, collection, layout, onProgress }) => {
  const { entities } = layout;
  let generatedLayout = {
    vertices: layout.vertices,
    edges: layout.edges,
    groupings: layout.groupings || [],
  };
  const entityPromises = [];
  const entityCount = entities.length;
  let i = 0;

  entities.forEach(({ id, schema, properties }) => {
    const createdEntity = undeleteEntity(
      { id, schema, properties, collection_id: collection.id },
    ).then((newEntity) => {
      if (!schema.isEdge) {
        generatedLayout = replaceEntityIdInLayout(
          { layout: generatedLayout, oldId: id, newId: newEntity.id },
        );
      }

      return newEntity;
    });
    entityPromises.push(createdEntity);
    onProgress(i / entityCount);
    i += 1;
  });
  const generatedEntities = await Promise.all(entityPromises);

  return { generatedEntities, generatedLayout };
};

// convert any entity references contained in entity properties to entityIds instead of
//  full Entity objects
const processApiEntity = (entity) => {
  const { properties } = entity;
  if (properties) {
    Object.entries(properties).forEach(([key, values]) => {
      properties[key] = values.map((value) => (value?.id ? value.id : value));
    });
  }

  return {
    ...entity,
    properties,
  };
};

export {
  createEntitiesFromDiagram,
  processApiEntity,
};
