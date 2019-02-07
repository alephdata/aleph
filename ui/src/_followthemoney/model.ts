// @ts-ignore
import Schema from './schema.ts';
import {schema} from "normalizr";


interface ISchemata {
  [schemaName: string]: {}
}

interface ISchemaList {
  [schemaName: string]: Schema
}


export default class Model {
  private schemaCache: ISchemaList = {};
  private readonly schemata: ISchemata = {};

  constructor(schemeta: ISchemata) {
    this.schemata = schemeta;
  }

  getInstance(){
    return Object.entries(this.schemata)
      .reduce(function(reducer, [schemaName, schemaImplementation]){
        return Object.assign(reducer,{
          [schemaName]:new Schema(schemaName, schemaImplementation)
        })
      }, {})
  }

  // _getInstance() {
  //   return new Proxy(this.schemata, {
  //     get: (schemata: ISchemata, schemaName: string): Schema => {
  //       if (this.schemaCache[schemaName]) {
  //         return this.schemaCache[schemaName];
  //       } else if (Object.keys(schemata).length) {
  //         const schema = schemata[schemaName];
  //         if (schema) {
  //           return this.schemaCache[schemaName] = new Schema(schemaName, schema);
  //         }
  //       } else {
  //         console.error(
  //           new Error(`Provide schemas implementation firs via 'Model.constructor' function`)
  //         )
  //       }
  //       return {};
  //     }
  //   });
  // }
}