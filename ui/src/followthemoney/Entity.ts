type IProperty = string[]
interface IProperties{
  [propertyName:string]:IProperty
}
class Entity {
  private readonly DESCRIPTION_PROPERTY:string = 'description';
  private readonly STRING_SEPARATOR:string = ',';
  private behaviour: any;
  constructor(entity){
    this.behaviour = entity;
  }
  get properties() : IProperty[]{
    return Object.values(this.behaviour.properties) || [];
  }
  get description(): string{
    const description = this.properties
      .find(([property]:IProperty) => (this.DESCRIPTION_PROPERTY === property));
    return description ? description[0] : ''
  }
  propertiesToKeyword(separate = this.STRING_SEPARATOR){
    return this.properties
      .map(([property]:IProperty) => property)
      .filter((property:string) => property !== this.DESCRIPTION_PROPERTY)
      .join(separate)
  }
}

export default Entity;
export {Entity}