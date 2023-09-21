import {
  defaultModel,
  Entity,
  Model,
  Namespace,
  Schema,
  IEntityDatum,
} from '@alephdata/followthemoney';

import {
  EntityChanges,
  EntityChangeUpdate,
} from 'react-ftm/components/common/types';
import { matchText } from 'react-ftm/utils';

export interface IEntityManagerProps {
  model?: Model;
  entities: Array<IEntityDatum>;
  namespace?: Namespace;
  createEntity?: (entity: IEntityDatum, local?: boolean) => Entity;
  updateEntity?: (entity: Entity) => void;
  deleteEntity?: (entityId: string) => void;
  expandEntity?: (
    entityId: string,
    properties?: Array<string>,
    limit?: number
  ) => Promise<any>;
  getEntitySuggestions?: (
    queryText: string,
    schemata?: Array<Schema>
  ) => Promise<Entity[]>;
  resolveEntityReference?: (entityId: string) => Entity | undefined;
}

export class EntityManager {
  public readonly model: Model;
  public readonly namespace?: Namespace;
  public readonly hasExpand: boolean = false;
  public readonly hasSuggest: boolean = false;
  entities = new Map<string, Entity>();
  private overload: any = {};

  constructor(props?: IEntityManagerProps) {
    if (props) {
      const { model, namespace, ...rest } = props;
      this.model = model || new Model(defaultModel);
      this.namespace = namespace;
      this.overload = rest;
      this.hasExpand = this.overload.expandEntity !== undefined;
      this.hasSuggest = this.overload.getEntitySuggestions !== undefined;
    } else {
      this.model = new Model(defaultModel);
    }

    this.getEntity = this.getEntity.bind(this);
    this.getEntities = this.getEntities.bind(this);
    this.getEntitySuggestions = this.getEntitySuggestions.bind(this);
    this.resolveEntityReference = this.resolveEntityReference.bind(this);
  }

  createEntity(entityData: any, local = true): Entity {
    let entity: Entity;
    if (entityData.id) {
      entity = this.model.getEntity(entityData);
    } else {
      const { properties, schema } = entityData;

      entity = this.model.createEntity(schema, this.namespace);

      if (properties) {
        Object.entries(properties).forEach(([prop, value]: [string, any]) => {
          if (Array.isArray(value)) {
            value.forEach((v) => entity.setProperty(prop, v));
          } else {
            entity.setProperty(prop, value);
          }
        });
      }
    }

    if (this.overload?.createEntity) {
      this.overload.createEntity(entity, local);
    }
    if (local) {
      this.addEntities([entity]);
    }
    return entity;
  }

  getEntities(ids?: Array<string>): Entity[] {
    if (ids) {
      return ids
        .map((id) => this.getEntity(id))
        .filter((e) => e !== undefined) as Entity[];
    } else {
      return Array.from(this.entities.values());
    }
  }

  getThingEntities(): Entity[] {
    return this.getEntities().filter((e) => !e.schema.edge);
  }

  getEntity(entityId: string): Entity | undefined {
    return this.entities.get(entityId);
  }

  hasEntity(entity: Entity): boolean {
    return this.entities.has(entity.id);
  }

  addEntities(entities: Array<Entity>) {
    entities.map((e) => this.entities.set(e.id, e));
  }

  updateEntity(entity: Entity) {
    this.entities.set(entity.id, entity);

    if (this.overload?.updateEntity) {
      this.overload.updateEntity(entity);
    }

    return entity;
  }

  deleteEntities(entityIds: Array<string>) {
    entityIds.forEach((entityId) => {
      this.entities.delete(entityId);
      if (this.overload?.deleteEntity) {
        this.overload.deleteEntity(entityId);
      }
    });
  }

  async expandEntity(
    entityId: string,
    properties?: Array<string>,
    limit?: number
  ) {
    if (this.overload?.expandEntity) {
      const expandResults = await this.overload.expandEntity(
        entityId,
        properties,
        limit
      );
      return expandResults;
    }
  }

  resolveEntityReference(entityId: string) {
    if (this.overload?.resolveEntityReference) {
      return this.overload.resolveEntityReference(entityId);
    }
  }

  async getEntitySuggestions(
    local: boolean,
    queryText: string,
    schemata?: Array<Schema>
  ) {
    if (local) {
      const predicate = (e: Entity) => {
        const schemaMatch = !schemata || e.schema.isAny(schemata);
        const textMatch = matchText(e.getCaption() || '', queryText);
        return schemaMatch && textMatch;
      };

      const entities = this.getEntities()
        .filter(predicate)
        .sort((a, b) =>
          a.getCaption().toLowerCase() > b.getCaption().toLowerCase() ? 1 : -1
        );

      return new Promise((resolve) => resolve(entities));
    }

    if (this.overload?.getEntitySuggestions) {
      const suggestions = await this.overload.getEntitySuggestions(
        queryText,
        schemata
      );
      return suggestions.filter((entity: Entity) => !this.hasEntity(entity));
    }
    return [];
  }

  // entity changes in the reverse direction require undoing create/delete operations
  applyEntityChanges(entityChanges: EntityChanges, factor: number) {
    const { created, updated, deleted } = entityChanges;

    created &&
      created.forEach((entity: Entity) =>
        factor > 0
          ? this.createEntity(entity)
          : this.deleteEntities([entity.id])
      );
    updated &&
      updated.forEach(({ prev, next }: EntityChangeUpdate) =>
        factor > 0 ? this.updateEntity(next) : this.updateEntity(prev)
      );
    deleted &&
      deleted.forEach((entity: Entity) =>
        factor > 0
          ? this.deleteEntities([entity.id])
          : this.createEntity(entity)
      );
  }

  toJSON(): Array<IEntityDatum> {
    return this.getEntities().map((entity) => entity.toJSON());
  }

  static fromJSON(
    props: any,
    entitiesData: Array<IEntityDatum>
  ): EntityManager {
    const entityManager = new EntityManager(props);

    const entities = entitiesData.map(
      (entityDatum: IEntityDatum) =>
        new Entity(entityManager.model, entityDatum)
    );

    entityManager.addEntities(entities);

    return entityManager;
  }
}
