export default class Property {
  public readonly name: string;
  private schema: any;
  private behaviour: any;

  constructor({name, ...behaviour}, schema) {
    this.name = name;
    this.schema = schema;
    this.behaviour = behaviour
  }
  get caption(){
    return this.behaviour.caption
  }
  extends(parentSchema){
    return this.behaviour.schema === parentSchema;
  }
  get label(): string{
    return this.behaviour.label || this.name;
  }
}