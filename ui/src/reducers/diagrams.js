import { createReducer } from 'redux-act';

import { fetchCollectionDiagrams, fetchCollectionDiagram, fetchRoleDiagrams, updateCollectionDiagram, createCollectionDiagram, deleteCollectionDiagram } from 'src/actions';
import { objectLoadStart, objectLoadError, objectLoadComplete, objectDelete, resultObjects } from 'src/reducers/util';

const initialState = {};

export default createReducer({
  // [fetchCollectionDiagrams.START]: (state, { data }) => resultObjects(state, data),
  //
  // [fetchCollectionDiagrams.ERROR]: (state, {
  //   error, args: { diagramId },
  // }) => objectLoadError(state, diagramId, error),

  [fetchRoleDiagrams.COMPLETE]: (state, { data }) => resultObjects(state, data),

  [fetchCollectionDiagrams.COMPLETE]: (state, { data }) => resultObjects(state, data),

  [fetchCollectionDiagram.COMPLETE]: (state, {
    diagramId, data,
  }) => objectLoadComplete(state, diagramId, data),

  [createCollectionDiagram.COMPLETE]: (state, {
    diagramId, data,
  }) => objectLoadComplete(state, diagramId, data),

  [updateCollectionDiagram.COMPLETE]: (state, {
    diagramId, data,
  }) => objectLoadComplete(state, diagramId, data),

  [deleteCollectionDiagram.COMPLETE]: (state, {
    diagramId,
  }) => objectDelete(state, collectionId),

}, initialState);
