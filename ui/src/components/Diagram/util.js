// import { VisGraph, EntityManager, GraphConfig, GraphLayout, Viewport } from '@alephdata/vislib';
// const config = new GraphConfig({ editorTheme: 'light', toolbarPosition: 'left' });

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
    const createdEntity = undeleteEntity({ id, schema, properties, collection_id: collection.id }).then((newEntity) => {
      console.log('entity created, calling repalce function', newEntity);
      if (!schema.isEdge) {
        generatedLayout = replaceEntityIdInLayout({ layout: generatedLayout, oldId: id, newId: newEntity.id });
        console.log('entity id replaced', generatedLayout);
      }

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


  // const graphLayout = GraphLayout.fromJSON(
  //   config,
  //   new EntityManager(),
  //   { ...generatedLayout, entities: generatedEntities, selection: [] },
  // );
  //
  // graphLayout.layout();

  // console.log(graphLayout);

  return { generatedEntities, generatedLayout };
}

const replaceEntityIdInLayout = ({ layout, oldId, newId }) => {
  console.log('in replaceEntityIdInLayout', oldId, newId);
  return {
    vertices: layout.vertices.map(v => {
      if (v.entityId === oldId) {
        v.entityId = newId;
        v.id = `entity:${newId}`
        console.log('replacing! v')
      }
      return v;
    }),
    edges: layout.edges,
    groupings: layout.groupings,
  }
}

// convert any entity references contained in entity properties to entityIds instead of
//  full Entity objects
const processApiEntity = (entity) => {
  const { properties } = entity;
  if (properties) {
    Object.entries(properties).forEach(([key, values]) => {
      properties[key] = values.map((value) => value?.id ? value.id : value);
    });
  }

  return {
    ...entity,
    properties
  }
}

export {
  createEntitiesFromDiagram,
  processApiEntity,
}
