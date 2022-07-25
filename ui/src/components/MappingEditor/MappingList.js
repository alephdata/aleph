import { Entity } from '@alephdata/followthemoney';
import { Colors } from '@blueprintjs/colors';

const colorOptions = [
  Colors.BLUE1,
  Colors.TURQUOISE1,
  Colors.VIOLET1,
  Colors.ORANGE1,
  Colors.GREEN1,
  Colors.RED1,
  Colors.INDIGO1,
  Colors.LIME1,
  Colors.SEPIA1,
  Colors.COBALT1,
  Colors.ROSE1,
];

class MappingList {
  constructor(model, mappingData) {
    this.model = model;
    this.mappingItems = new Map();

    if (mappingData) {
      Object.entries(mappingData).forEach(
        ([id, { schema, keys, properties }], i) => {
          const ftmSchema = model.getSchema(schema);
          this.mappingItems.set(id, {
            id,
            color: this.assignColor(i),
            altLabel: this.getLabelFromId(id, ftmSchema),
            schema: ftmSchema,
            keys: keys || [],
            properties: properties || {},
          });
        }
      );
    }

    this.removeProperty = this.removeProperty.bind(this);
    this.changeId = this.changeId.bind(this);
  }

  assignColor() {
    const colorIndex = this.getValues()
      .map((mapping) => colorOptions.indexOf(mapping.color))
      .sort()
      .reduce((acc, currentValue) => (acc === currentValue ? acc + 1 : acc), 0);

    return colorOptions[colorIndex % colorOptions.length];
  }

  assignId(schema) {
    const schemaCount = this.getSchemaCount(schema);
    return schemaCount ? `${schema.name}${schemaCount + 1}` : schema.name;
  }

  // for pre-existing mappings, generate display label from schema id
  getLabelFromId(id, schema) {
    const schemaName = schema?.name;
    if (!schemaName) {
      return;
    }

    const re = new RegExp(`^${schemaName}(?<index>([0-9]*))$`);
    const match = id.match(re)?.groups;
    if (!match) {
      return;
    }

    const label = `${schema.label} ${match.index}`.trim();
    if (label !== id) {
      return label;
    }
  }

  changeId(oldId, newId) {
    const mapping = this.getMapping(oldId);
    if (mapping && oldId !== newId) {
      mapping.id = newId;
      mapping.altLabel = null;
      this.mappingItems.set(newId, mapping);

      // replace any references to this mapping in other mappings' properties
      this.applyToEntityRefs(oldId, (mappingId, propName) =>
        this.addProperty(mappingId, propName, { entity: newId })
      );
      this.removeMapping(oldId);
    }

    return this;
  }

  getValues() {
    return Array.from(this.mappingItems.values());
  }

  getSchemaCount(schemaToAssign) {
    return this.getValues().filter(({ schema }) => schema === schemaToAssign)
      .length;
  }

  getMappingsCount() {
    return this.mappingItems.size;
  }

  getMapping(id) {
    return this.mappingItems.get(id);
  }

  getMappingKeys(id) {
    const mapping = this.getMapping(id);
    if (!mapping) {
      return [];
    }
    const { keys, properties, schema } = mapping;

    if (schema.isEdge) {
      let sourceKeys = [],
        targetKeys = [];
      const { source, target } = schema.edge;

      if (properties[source]) {
        sourceKeys = this.getMappingKeys(properties[source].entity);
      }
      if (properties[target]) {
        targetKeys = this.getMappingKeys(properties[target].entity);
      }

      return [...new Set([...sourceKeys, ...targetKeys, ...keys])];
    } else {
      return keys;
    }
  }

  // returns pseudo-entity for mapping, in order to be allow Entity ftm components to be used
  getMappingAsEntity(id) {
    const { properties, schema } = this.getMapping(id);
    const formattedProps = {};

    // convert properties to Entity > properties format
    Object.entries(properties)
      /* eslint-disable no-unused-vars */
      .filter(([_, value]) => value.literal)
      .forEach(([key, value]) => {
        formattedProps[key] = value.literal;
      });

    return new Entity(this.model, { id, schema, properties: formattedProps });
  }

  getThingMappings() {
    return this.getValues().filter(({ schema }) => schema?.isThing());
  }

  getNonThingMappings() {
    return this.getValues().filter(({ schema }) => !schema?.isThing());
  }

  addMapping(schema) {
    const id = this.assignId(schema);
    const schemaCount = this.getSchemaCount(schema);

    const newMapping = {
      id,
      altLabel: schemaCount
        ? `${schema.label} ${schemaCount + 1}`
        : schema.label,
      color: this.assignColor(),
      schema,
      keys: [],
      properties: {},
    };
    this.mappingItems.set(id, newMapping);
    return this;
  }

  removeMapping(idToRemove) {
    this.mappingItems.delete(idToRemove);
    // remove any references to this mapping in other mappings' properties
    this.applyToEntityRefs(idToRemove, this.removeProperty);

    return this;
  }

  applyToEntityRefs(id, applyFunc) {
    this.getValues().forEach((mapping) => {
      if (mapping?.properties) {
        Object.entries(mapping.properties).forEach(([propName, propValue]) => {
          if (propValue?.entity && propValue?.entity === id) {
            applyFunc(mapping.id, propName);
          }
        });
      }
    });
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

    this.mappingItems.forEach((mapping) => {
      const { properties, schema } = mapping;
      if (properties) {
        Array.from(Object.entries(properties)).forEach(
          ([propKey, propValue]) => {
            if (propValue && propValue.column) {
              columnAssignments.set(propValue.column, {
                ...mapping,
                property: schema.getProperty(propKey),
              });
            }
          }
        );
      }
    });

    return columnAssignments;
  }

  validate() {
    const errors = [];
    this.mappingItems.forEach(({ id, properties, schema }) => {
      if (this.getMappingKeys(id).length === 0) {
        errors.push({ error: 'keyError', values: { id } });
      }
      if (schema.isEdge) {
        const { source, target } = schema.edge;

        if (!properties[source] || !properties[target]) {
          errors.push({
            error: 'relationshipError',
            values: { id, source, target },
          });
        }
      }
    });
    return errors;
  }

  clone() {
    return MappingList.fromApiFormat(this.model, this.mappingItems);
  }

  toApiFormat() {
    const query = {};

    this.mappingItems.forEach(({ id, schema, properties }) => {
      const queryItem = {
        schema: schema.name,
        keys: this.getMappingKeys(id),
        properties,
      };
      if (!schema?.isThing()) {
        queryItem.key_literal = schema.name;
      }
      query[id] = queryItem;
    });

    return query;
  }

  static fromApiFormat(model, mappingData) {
    return new MappingList(model, mappingData);
  }
}

export default MappingList;
