// @ts-ignore
import Property from './property.ts';

interface ILabelReadingConfiguration {
  forcePlural: boolean
}

interface IProperties {
  [propertyName: string]: Property,
}


export default class Schema {
  public readonly icon: string;
  public properties: IProperties = new Map();
  private readonly name: string;
  private readonly label: string;
  private readonly plural: string;
  private readonly featured: Array<string>;
  private readonly DOCUMENT_SCHEMATA: string[] = [
    'Document', 'Pages', 'Folder',
    'Package', 'Email', 'HyperText',
    'Workbook', 'Table', 'PlainText',
    'Image', 'Video', 'Audio'
  ];

  constructor(schemaName, theImplementation) {
    this.name = schemaName;
    this.label = theImplementation.label;
    this.plural = theImplementation.plural;
    this.icon = theImplementation.icon;
    this.featured = theImplementation.featured;
    Object
      .entries(theImplementation.properties)
      .forEach(([propertyName, property]) => {
        this.properties.set(propertyName, new Property(property, this))
      })
  }

  static hasSchemata(document, schemata: string[]): boolean {
    if (document) {
      return !!schemata.find(schema => !!~document.schemata.indexOf(schema))
    }
    return false;
  }

  getLabel({forcePlural}: ILabelReadingConfiguration) {
    let label = this.label || this.name;
    if (forcePlural || this.plural) {
      label = this.plural || label;
    }
    return label;
  }

  reverseLabel(reference) {
    if (!reference || !reference.property) {
      return null;
    }
    const prop = reference.property;
    const reverse = this.properties.get(prop.reverse) || prop;
    return reverse.label;
  };

  isFeaturedProp(propertyName) {
    return !!~this.featured.indexOf(propertyName)
  }

  isDocumentSchema(): boolean {
    return !!~this.DOCUMENT_SCHEMATA.indexOf(this.name)
  }

  getEntityProperties(entity: Schema): Property[] {
    return Object.keys(entity.properties).filter((entityProperty)=>{
      return  !this.properties.get(entityProperty).caption
    }).map(property => this.properties.get(property))
  }

  getFeaturedProperties() {
    return this.featured
      .map(featuredPropertyName => this.properties.get(featuredPropertyName))
  }

  extends(schemaName): boolean {
    /*FIXME: Include parent schema name*/
    return !!Array.from(this.properties.values())
      .find((property: Property) => property.extends(schemaName))
  }

}