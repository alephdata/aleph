// convert any entity references contained in entity properties to entityIds instead of
//  full Entity objects
const processApiEntity = (entity) => {
  const props = entity.getProperties();

  props.forEach(prop => {
    const type = prop.type.name;
    if (type === 'entity') {
      const values = entity.getProperty(prop);
      entity.properties.set(prop, values.map((value) => (value?.id ? value.id : value)));
    }
  })

  return entity.toJSON();
};

export {
  processApiEntity,
};
