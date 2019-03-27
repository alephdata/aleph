import { Entity as FTMEntity } from '@alephdata/vis2';
import Schema from '@alephdata/vis2/dist/types/followthemoney/schema'

export class Entity extends FTMEntity {
  private readonly SEARCHABLES = ['Pages', 'Table', 'Folder', 'Package', 'Workbook'];
  constructor(schema:Schema, specifications){
    super(schema, specifications);
    if(specifications){
      Object.entries(specifications)
        .filter(specification => !this[specification[0]])
        .forEach(specification => Reflect.set(this, specification[0], specification[1]))
    }
  }
  hasSearch():boolean{
    return !!~this.SEARCHABLES.indexOf(this.schema.name)
  }
}