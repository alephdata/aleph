const createEntitiesFromDiagram = async ({undeleteEntity, collection, layout, onProgress}) => {
  console.log('in create from layout, entities are', layout.entities);
  const { entities } = layout;
  let generatedLayout = { vertices:layout.vertices, edges: layout.edges, groupings: layout.groupings || [] };
  const entityPromises = [];
  const entityCount = entities.length;
  let i = 0;

  console.log('output layout it', generatedLayout);

  entities.forEach(({id, schema, properties}) => {
    console.log('looping thru entities, entity is', schema, properties);
    const createdEntity = undeleteEntity({ schema, properties, collection_id: collection.id }).then((newEntity) => {
      console.log('entity created, calling repalce function', newEntity);
      generatedLayout = replaceEntityIdInLayout({ layout: generatedLayout, oldId: id, newId: newEntity.id });
      console.log('entity id replaced', generatedLayout);

      return newEntity;
    });
    entityPromises.push(createdEntity);
    onProgress(i/entityCount);
    i++;
  });
  console.log('createdentities array is before promise resolve', entityPromises);
  const generatedEntities = await Promise.all(entityPromises)
  console.log('completed createdentities array is', generatedEntities);
  console.log('completed outputlayout is', generatedLayout);

  return { generatedEntities, generatedLayout };
}

const replaceEntityIdInLayout = ({ layout, oldId, newId }) => {
  console.log('in replaceEntityIdInLayout', oldId, newId);
  return {
    vertices: layout.vertices.map(v => {
      if (v.entityId === oldId) {
        v.entityId = newId;
        console.log('replacing! v')
      }
      return v;
    }),
    edges: layout.edges.map(e => {
      if (e.entityId === oldId) {
        e.entityId = newId;
        console.log('replacing! e')
      }
      return e;
    }),
    groupings: layout.groupings,
  }
}

export {
  createEntitiesFromDiagram,
}
