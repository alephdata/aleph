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
  processApiEntity,
};
