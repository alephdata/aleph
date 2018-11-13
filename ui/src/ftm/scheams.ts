// @ts-ignore
import Property from './property.ts';

interface ILabelReadingConfiguration {
    forcePlural: boolean
}
interface IProperties {
    [x:string]: Property
}

export default class Schema {
    private readonly name: string;
    private readonly label: string;
    private readonly plural: string;
    public readonly icon: string;
    public readonly featured: Array<string>;
    public properties: IProperties = {};

    constructor(schemaName, theImplementation){
        this.name = schemaName;
        this.label = theImplementation.label;
        this.plural = theImplementation.plural;
        this.icon = theImplementation.icon;
        this.featured = theImplementation.featured;
        Object
            .entries(theImplementation.properties)
            .forEach(([propertyName,property])=> {
                Object.assign(this.properties, {
                    [propertyName]: new Property(property, this)
                })
            })
    }
    getLabel({ forcePlural }:ILabelReadingConfiguration){
        let label = this.label || this.name;
        if (forcePlural || this.plural) {
            label = this.plural || label;
        }
        return label;
    }
}