import { Entity } from '@alephdata/followthemoney';


class MappingItem {
  constructor(model, { color, id, keys, properties, schema }) {
    this.color = color;
    this.id = id;
    this.keys = keys;
    this.properties = properties || {};
    this.schema = model.getSchema(schema.name);
  }
}

export default MappingItem;
