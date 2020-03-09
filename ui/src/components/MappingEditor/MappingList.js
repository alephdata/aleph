import { Entity, Property } from '@alephdata/followthemoney';
import { Colors } from '@blueprintjs/core';

const colorOptions = [
  Colors.BLUE1, Colors.TURQUOISE1, Colors.VIOLET1, Colors.ORANGE1, Colors.GREEN1, Colors.RED1,
];

class MappingList {
  constructor(model, mappingData) {
    this.model = model;
    this.mappingItems = new Map();

    if (mappingData) {
      console.log('has mapping data!!!');
      Object.entries(mappingData).forEach(([id, { schema, keys, properties }], i) => {
        this.mappingItems.set(id, {
          color: this.assignColor(i),
          id,
          schema: model.getSchema(schema),
          keys,
          properties: properties || {},
        });
      });
    }
  }

  assignColor(i) {
    const colorIndex = i || this.getMappingsCount();
    return colorOptions[colorIndex % colorOptions.length];
  }

  assignId(schema) {
    const schemaCount = this.getSchemaCount(schema.name);

    return schemaCount ? `${schema.label} ${schemaCount + 1}` : schema.label;
  }

  getValues() {
    return Array.from(this.mappingItems.values());
  }

  getSchemaCount(schemaName) {
    return this.getValues().filter(({ schema }) => schema === schemaName).length;
  }

  getMappingsCount() {
    return this.mappingItems.size;
  }

  getMapping(id) {
    return this.mappingItems.get(id);
  }

  getMappingAsEntity(id) {
    const { schema } = this.getMapping(id);
    return new Entity(this.model, { id, schema });
  }

  getThingMappings() {
    return this.getValues().filter(({ schema }) => schema?.isThing());
  }

  getNonThingMappings() {
    return this.getValues().filter(({ schema }) => !schema?.isThing());
  }

  getMappingsAsEntities() {
    const toReturn = new Map();
    this.getValues().forEach(({ id, schema, properties }) => {
      console.log('iterating toReturn', id, schema, properties);
      toReturn.set(id, new Entity(this.model, { id, schema }));
    });

    console.log('toReturn', toReturn);
    return toReturn;
  }

  addMapping(schema) {
    const id = this.assignId(schema);

    const newMapping = {
      id,
      color: this.assignColor(),
      schema,
      keys: [],
      properties: {},
    };
    this.mappingItems.set(id, newMapping);
    return this;
  }

  removeMapping(id) {
    this.mappingItems.delete(id);
    return this;
  }

  addKey(id, key) {
    const mapping = this.getMapping(id);
    mapping.keys.push(key);
    return this;
  }

  removeKey(id, key) {
    const mapping = this.getMapping(id);
    const index = mapping.keys.indexOf(key);
    if (index !== -1) {
      mapping.keys.splice(index, 1);
    }
    return this;
  }

  addProperty(id, propName, value) {
    const mapping = this.getMapping(id);
    mapping.properties[propName] = value;
    return this;
  }

  removeProperty(id, propName) {
    const mapping = this.getMapping(id);
    delete mapping.properties[propName];
    return this;
  }

  getColumnAssignments() {
    const columnAssignments = new Map();

    this.mappingItems.forEach(({ id, schema, properties }) => {
      if (properties) {
        Array.from(Object.entries(properties)).forEach(([propKey, propValue]) => {
          if (propValue && propValue.column) {
            columnAssignments.set(propValue.column, {
              id, schema, property: schema.getProperty(propKey),
            });
          }
        });
      }
    });

    return columnAssignments;
  }

  validate() {
    const errors = [];
    this.mappingItems.forEach(({ id, keys, properties, schema }) => {
      if (keys.length === 0) {
        errors.push({ error: 'keyError', values: { id } });
      }
      if (schema.isEdge) {
        const { source, target } = schema.edge;

        if (!properties[source] || !properties[target]) {
          errors.push({ error: 'relationshipError', values: { id, source, target } });
        }
      }
    });
    return errors;
  }

  clone() {
    return MappingList.fromData(this.model, this.mappingItems);
  }

  toApiFormat() {
    const query = {};

    this.mappingItems.forEach(({ id, schema, keys, properties }) => {
      query[id] = {
        schema: schema.name,
        keys,
        properties,
      };
    });

    return query;
  }

  static fromApiFormat(model, mappingData): Vertex {
    return new MappingList(model, mappingData);
  }
}

export default MappingList;
