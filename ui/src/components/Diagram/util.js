const bulkCreateEntities = async ({collection, layout, createEntity}) => {
  console.log('in create from layout, entities are', layout.entities);
  const { entities } = layout;
  let outputLayout = { vertices:layout.vertices, edges: layout.edges };
  const entityPromises = [];

  console.log('output layout it', outputLayout);

  entities.forEach(({id, schema, properties}) => {
    console.log('looping thru entities, entity is', schema, properties);
    const createdEntity = createEntity({ schema, properties, collection }).then((newEntity) => {
      console.log('entity created, calling repalce function', newEntity);
      outputLayout = replaceEntityIdInLayout({ layout: outputLayout, oldId: id, newId: newEntity.id });
      console.log('entity id replaced', outputLayout);

      return newEntity;
    });
    entityPromises.push(createdEntity);
  });
  console.log('createdentities array is before promise resolve', entityPromises);
  const outputEntities = await Promise.all(entityPromises)
  console.log('completed createdentities array is', outputEntities);
  console.log('completed outputlayout is', outputLayout);

  return outputEntities;
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
  }
}

export {
  bulkCreateEntities,
}
