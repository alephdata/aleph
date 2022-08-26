import { Entity } from '@alephdata/followthemoney';

export interface EntityChangeUpdate {
  prev: Entity;
  next: Entity;
}

export interface EntityChanges {
  created?: Array<Entity>;
  updated?: Array<EntityChangeUpdate>;
  deleted?: Array<Entity>;
}
