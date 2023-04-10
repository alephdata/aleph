import { createReducer } from 'redux-act';

import {
  queryEntities,
  querySimilar,
  queryCollectionXref,
  queryEntitySetEntities,
  queryEntitySetItems,
  fetchEntity,
  createEntity,
  updateEntity,
  deleteEntity,
  pairwiseJudgement,
  createBookmark,
  deleteBookmark,
} from 'actions';
import {
  objectLoadStart,
  objectLoadError,
  objectLoadComplete,
  objectDelete,
  resultObjects,
  loadComplete,
} from 'reducers/util';

const initialState = {};

function nestedEntityObjects(state, result) {
  if (result.results && result.results.length) {
    result.results.forEach((result) => {
      if (result.entity?.id) {
        result.entityId = result.entity.id;
        state[result.entityId] = loadComplete({ ...result.entity });
      }
      if (result.match?.id) {
        result.matchId = result.match.id;
        state[result.matchId] = loadComplete({ ...result.match });
      }
    });
  }
  return state;
}

function updateEntityProfile(state, entityId, profileId) {
  return {
    ...state,
    [entityId]: {
      ...state[entityId],
      profile_id: profileId,
    },
  };
}

export default createReducer(
  {
    [fetchEntity.START]: (state, { id }) => objectLoadStart(state, id),

    [fetchEntity.ERROR]: (state, { error, args: { id } }) =>
      objectLoadError(state, id, error),

    [fetchEntity.COMPLETE]: (state, { id, data }) =>
      objectLoadComplete(state, id, data),

    [createEntity.START]: (state, { id }) => objectLoadStart(state, id),

    [createEntity.ERROR]: (state, { error, args: { id } }) =>
      objectLoadError(state, id, error),

    [createEntity.COMPLETE]: (state, { id, data }) =>
      objectLoadComplete(state, id, data),

    [updateEntity.START]: (state, { id }) => objectLoadStart(state, id),

    [updateEntity.COMPLETE]: (state, { id, data }) =>
      objectLoadComplete(state, id, data),

    [queryEntities.COMPLETE]: (state, { result }) =>
      resultObjects(state, result),

    [querySimilar.COMPLETE]: (state, { result }) =>
      nestedEntityObjects(state, result),

    [queryCollectionXref.COMPLETE]: (state, { result }) =>
      nestedEntityObjects(state, result),

    [queryEntitySetItems.COMPLETE]: (state, { result }) =>
      nestedEntityObjects(state, result),

    [queryEntitySetEntities.COMPLETE]: (state, { result }) =>
      resultObjects(state, result),

    [deleteEntity.COMPLETE]: (state, { id }) => objectDelete(state, id),

    [pairwiseJudgement.COMPLETE]: (state, { entityId, profileId }) =>
      updateEntityProfile(state, entityId, profileId),

    [createBookmark.START]: (state, entity) => ({
      ...state,
      [entity.id]: { ...state[entity.id], bookmarked: true },
    }),

    [deleteBookmark.START]: (state, entity) => ({
      ...state,
      [entity.id]: { ...state[entity.id], bookmarked: false },
    }),
  },
  initialState
);
