export default class Property {
  public readonly name: string;
  private schema: any;
  private behaviour: any;

  constructor({name, ...behaviour}, schema) {
    this.name = name;
    this.schema = schema;
    this.behaviour = behaviour;
  }

  get caption() {
    return this.behaviour.caption
  }

  get label(): string {
    return this.behaviour.label || this.name;
  }

  get type(): string {
    return this.behaviour.type;
  }

  extends(parentSchema) {
    return this.behaviour.schema === parentSchema;
  }
}