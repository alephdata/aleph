import { createReducer } from 'redux-act';

import { queryDiagrams, fetchDiagram, updateDiagram, createDiagram, deleteDiagram } from 'src/actions';
import { objectLoadComplete, objectLoadError, objectDelete, resultObjects } from 'src/reducers/util';

const initialState = {};

export default createReducer({
  [queryDiagrams.COMPLETE]: (state, { result }) => resultObjects(state, result),

  [fetchDiagram.ERROR]: (state, {
    error, args,
  }) => objectLoadError(state, args, error),

  [fetchDiagram.COMPLETE]: (state, {
    diagramId, data,
  }) => objectLoadComplete(state, diagramId, data),

  [createDiagram.COMPLETE]: (state, {
    diagramId, data,
  }) => objectLoadComplete(state, diagramId, data),

  [updateDiagram.COMPLETE]: (state, {
    diagramId, data,
  }) => objectLoadComplete(state, diagramId, data),

  [deleteDiagram.COMPLETE]: (state, {
    diagramId,
  }) => objectDelete(state, diagramId),

}, initialState);
