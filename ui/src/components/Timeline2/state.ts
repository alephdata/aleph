import { Entity } from '@alephdata/followthemoney';
import type { Vertex, Layout, TimelineEntity } from './types';

type State = {
  entities: Array<Entity>;
  layout: Layout;
  selectedId: string | null;
};

type SelectEntityAction = {
  type: 'SELECT_ENTITY';
  payload: {
    entity: Entity;
  };
};

type UpdateVertexAction = {
  type: 'UPDATE_VERTEX';
  payload: {
    vertex: Vertex;
  };
};

type UpdateEntityAction = {
  type: 'UPDATE_ENTITY';
  payload: {
    entity: Entity;
  };
};

type CreateEntityAction = {
  type: 'CREATE_ENTITY';
  payload: {
    entity: Entity;
  };
};

type RemoveEntityAction = {
  type: 'REMOVE_ENTITY';
  payload: {
    entity: Entity;
  };
};

type Action =
  | SelectEntityAction
  | UpdateVertexAction
  | UpdateEntityAction
  | CreateEntityAction
  | RemoveEntityAction;

const reducer = (state: State, { type, payload }: Action): State => {
  if (type === 'SELECT_ENTITY') {
    if (payload.entity.id === state.selectedId) {
      return { ...state, selectedId: null };
    }

    return { ...state, selectedId: payload.entity.id };
  }

  if (type === 'UPDATE_VERTEX') {
    const vertices = state.layout.vertices;
    const index = state.layout.vertices.findIndex(
      (vertex) => vertex.entityId === payload.vertex.entityId
    );

    if (index < 0) {
      vertices.push(payload.vertex);
    } else {
      vertices.splice(index, 1, payload.vertex);
    }

    return { ...state, layout: { vertices } };
  }

  if (type === 'UPDATE_ENTITY') {
    const index = state.entities.findIndex(
      (entity) => entity.id === payload.entity.id
    );

    if (index < 0) {
      state.entities.push(payload.entity);
    } else {
      state.entities.splice(index, 1, payload.entity);
    }

    return { ...state, entities: state.entities };
  }

  if (type === 'CREATE_ENTITY') {
    let newState = reducer(state, { type: 'UPDATE_ENTITY', payload });
    return reducer(newState, { type: 'SELECT_ENTITY', payload });
  }

  if (type === 'REMOVE_ENTITY') {
    const entities = state.entities.filter(
      (entity) => entity.id !== payload.entity.id
    );

    const selectedId =
      state.selectedId === payload.entity.id ? null : state.selectedId;

    return { ...state, selectedId, entities };
  }

  throw new Error('Invalid action type.');
};

const selectSelectedEntity = (state: State): Entity | null =>
  state.entities.find((entity) => entity.id === state.selectedId) || null;

const selectSelectedVertex = (state: State): Vertex | null => {
  const entity = selectSelectedEntity(state);

  if (!entity) {
    return null;
  }

  const defaultVertex = { entityId: entity.id };

  return (
    state.layout.vertices.find((vertex) => vertex.entityId === entity.id) ||
    defaultVertex
  );
};

const selectSortedEntities = (state: State): Array<Entity> => {
  return state.entities
    .filter(
      (entity): entity is TimelineEntity => entity.getTemporalStart() !== null
    )
    .sort((a, b) => {
      const aStart = a.getTemporalStart().value;
      const bStart = b.getTemporalStart().value;

      return aStart.localeCompare(bStart);
    });
};

export type { State, Action };
export {
  reducer,
  selectSortedEntities,
  selectSelectedEntity,
  selectSelectedVertex,
};
