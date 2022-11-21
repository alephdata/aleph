import { Entity, Model, Schema, Property } from '@alephdata/followthemoney';

class EdgeType {
  public schema?: Schema;
  public property?: Property;
  public label: string;
  public key: string;

  constructor(schema?: Schema, property?: Property) {
    this.schema = schema;
    this.property = property;
    this.label = ((schema && schema.label) ||
      (property && property.label)) as string;
    this.key = ((schema && schema.name) ||
      (property && property.qname)) as string;
  }

  match(source: Entity, target: Entity): boolean {
    if (!source) {
      return false;
    }
    if (this.property && source.schema.hasProperty(this.property)) {
      return target.schema.isA(this.property.getRange());
    }
    if (this.schema && this.schema.edge && target) {
      const sourceProperty = this.schema.getProperty(this.schema.edge.source);
      const targetProperty = this.schema.getProperty(this.schema.edge.target);
      if (source.schema.isA(sourceProperty.getRange())) {
        if (target.schema.isA(targetProperty.getRange())) {
          return true;
        }
      }
    }
    return false;
  }

  isPropertyEdgeType() {
    return this.property !== undefined;
  }

  static getAll(model: Model): EdgeType[] {
    const types = new Array<EdgeType>();
    model.getSchemata().forEach((schema) => {
      types.push(new EdgeType(schema));
    });
    model.getProperties().forEach((prop) => {
      if (prop.type.grouped && !prop.stub && prop.hasRange) {
        types.push(new EdgeType(undefined, prop));
      }
    });
    return types.sort((a, b) => a.label.localeCompare(b.label));
  }
}

export default EdgeType;
