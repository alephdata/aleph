import { useReducer } from 'react';
import { Entity } from '@alephdata/followthemoney';
import { differenceInYears } from 'date-fns';
import type {
  Vertex,
  Layout,
  TimelineChartZoomLevel,
  TimelineRenderer,
} from './types';
import {
  updateVertex,
  TimelineItem,
  getEarliestDate,
  getLatestDate,
} from './util';

export type State = {
  entities: Array<Entity>;
  layout: Layout;
  selectedId: string | null;
  renderer: TimelineRenderer;
  zoomLevel: TimelineChartZoomLevel;
  showCreateDialog: boolean;
};

export const DAYS_ZOOM_LEVEL_MAX_YEARS = 20;
export const MONTHS_ZOOM_LEVEL_MAX_YEARS = 100;

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

type SetRendererAction = {
  type: 'SET_RENDERER';
  payload: {
    renderer: TimelineRenderer;
  };
};

export type Action =
  | SelectEntityAction
  | UnselectEntityAction
  | UpdateVertexAction
  | UpdateEntityAction
  | CreateEntityAction
  | RemoveEntityAction
  | SetZoomLevelAction
  | ToggleCreateDialogAction
  | SetRendererAction;

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

  if (type === 'SET_RENDERER') {
    return { ...state, renderer: action.payload.renderer };
  }

  throw new Error('Invalid action type.');
}

export function useTimelineState(entities: Array<Entity>, layout?: Layout) {
  return useReducer(reducer, {
    entities,
    layout: layout || {},
    selectedId: null,
    renderer: 'list',
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
  const vertices = state.layout.vertices || [];

  return (
    vertices.find((vertex) => vertex.entityId === entity.id) || defaultVertex
  );
}

export function selectItems(state: State): Array<TimelineItem> {
  return state.entities
    .map((entity) => new TimelineItem(entity, state.layout))
    .sort((a, b) => {
      const aStart = a.entity.getTemporalStart();
      const bStart = b.entity.getTemporalStart();

      if (aStart === null && bStart === null) {
        return 0;
      }

      if (aStart === null) {
        return -1;
      }

      if (bStart === null) {
        return 1;
      }

      return aStart.value.localeCompare(bStart.value);
    });
}

export function selectIsEmpty(state: State): boolean {
  return selectItems(state).length <= 0;
}

export function selectIsZoomEnabled(state: State): boolean {
  return state.renderer === 'chart';
}

export function selectAvailableZoomLevels(
  state: State
): Array<TimelineChartZoomLevel> {
  const items = selectItems(state);
  const earliest = getLatestDate(items);
  const latest = getEarliestDate(items);

  if (!earliest || !latest) {
    return ['days', 'months', 'years'];
  }

  const years = differenceInYears(earliest, latest);

  if (years < DAYS_ZOOM_LEVEL_MAX_YEARS) {
    return ['days', 'months', 'years'];
  }

  if (years < MONTHS_ZOOM_LEVEL_MAX_YEARS) {
    return ['months', 'years'];
  }

  return ['years'];
}

export function selectZoomLevel(state: State): TimelineChartZoomLevel {
  const available = selectAvailableZoomLevels(state);

  if (!available.includes(state.zoomLevel)) {
    return available[0];
  }

  return state.zoomLevel;
}
