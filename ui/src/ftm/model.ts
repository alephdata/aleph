// @ts-ignore
import Schema from './scheams.ts';


interface schemaCollection{
    [x:string]:{
        me:string
    }
}
let schemeta:schemaCollection = {};
const _schemaCache = {};
export function initialize(schema: schemaCollection){
    Object.assign(schemeta,schema);
}


export const model = new Proxy(schemeta,{
    get:(schemasImplementation, schemaName:string):Schema => {
        if(Object.keys(schemasImplementation).length){
            const theSchemaImplementation = schemasImplementation[schemaName];
            if(theSchemaImplementation){
                if(_schemaCache[schemaName]){
                    return _schemaCache[schemaName]
                }else{
                    return _schemaCache[schemaName] = new Schema(schemaName, theSchemaImplementation);
                }

            }
        }else{
            console.error(
                new Error(`Provide schemas implementation firs via 'Model.initialize' function`)
            )
        }
        return {};
    }
});