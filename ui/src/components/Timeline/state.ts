import { useReducer } from 'react';
import { Entity } from '@alephdata/followthemoney';
import type {
  Vertex,
  Layout,
  TimelineEntity,
  TimelineChartZoomLevel,
} from './types';
import { updateVertex } from './util';

export type State = {
  entities: Array<Entity>;
  layout: Layout;
  selectedId: string | null;
  zoomLevel: TimelineChartZoomLevel;
  showCreateDialog: boolean;
};

type SelectEntityAction = {
  type: 'SELECT_ENTITY';
  payload: {
    entity: Entity;
  };
};

type UnselectEntityAction = {
  type: 'UNSELECT_ENTITY';
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

type SetZoomLevelAction = {
  type: 'SET_ZOOM_LEVEL';
  payload: {
    zoomLevel: TimelineChartZoomLevel;
  };
};

type ToggleCreateDialogAction = {
  type: 'TOGGLE_CREATE_DIALOG';
};

export type Action =
  | SelectEntityAction
  | UnselectEntityAction
  | UpdateVertexAction
  | UpdateEntityAction
  | CreateEntityAction
  | RemoveEntityAction
  | SetZoomLevelAction
  | ToggleCreateDialogAction;

export function reducer(state: State, action: Action): State {
  const { type } = action;

  if (type === 'SELECT_ENTITY') {
    if (action.payload.entity.id === state.selectedId) {
      return reducer(state, { type: 'UNSELECT_ENTITY' });
    }

    return { ...state, selectedId: action.payload.entity.id };
  }

  if (type === 'UNSELECT_ENTITY') {
    return { ...state, selectedId: null };
  }

  if (type === 'UPDATE_VERTEX') {
    const newLayout = updateVertex(state.layout, action.payload.vertex);
    return { ...state, layout: newLayout };
  }

  if (type === 'UPDATE_ENTITY') {
    const index = state.entities.findIndex(
      (entity) => entity.id === action.payload.entity.id
    );

    if (index < 0) {
      state.entities.push(action.payload.entity);
    } else {
      state.entities.splice(index, 1, action.payload.entity);
    }

    return { ...state, entities: state.entities };
  }

  if (type === 'CREATE_ENTITY') {
    let newState = reducer(state, {
      type: 'UPDATE_ENTITY',
      payload: action.payload,
    });
    return reducer(newState, {
      type: 'SELECT_ENTITY',
      payload: action.payload,
    });
  }

  if (type === 'REMOVE_ENTITY') {
    const entities = state.entities.filter(
      (entity) => entity.id !== action.payload.entity.id
    );

    const selectedId =
      state.selectedId === action.payload.entity.id ? null : state.selectedId;

    return { ...state, selectedId, entities };
  }

  if (type === 'SET_ZOOM_LEVEL') {
    return { ...state, zoomLevel: action.payload.zoomLevel };
  }

  if (type === 'TOGGLE_CREATE_DIALOG') {
    return { ...state, showCreateDialog: !state.showCreateDialog };
  }

  throw new Error('Invalid action type.');
}

export function useTimelineState(entities: Array<Entity>, layout?: Layout) {
  return useReducer(reducer, {
    entities,
    layout: layout || { vertices: [] },
    selectedId: null,
    zoomLevel: 'months',
    showCreateDialog: false,
  });
}

export function selectSelectedEntity(state: State): Entity | null {
  return (
    state.entities.find((entity) => entity.id === state.selectedId) || null
  );
}

export function selectSelectedVertex(state: State): Vertex | null {
  const entity = selectSelectedEntity(state);

  if (!entity) {
    return null;
  }

  const defaultVertex = { entityId: entity.id };

  return (
    state.layout.vertices.find((vertex) => vertex.entityId === entity.id) ||
    defaultVertex
  );
}

export function selectSortedEntities(state: State): Array<Entity> {
  return state.entities
    .filter(
      (entity): entity is TimelineEntity => entity.getTemporalStart() !== null
    )
    .sort((a, b) => {
      const aStart = a.getTemporalStart().value;
      const bStart = b.getTemporalStart().value;

      return aStart.localeCompare(bStart);
    });
}
