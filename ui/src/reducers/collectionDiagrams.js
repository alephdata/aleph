import { createReducer } from 'redux-act';

import { fetchCollectionDiagrams } from 'src/actions';
import { objectLoadStart, objectLoadError, objectLoadComplete } from 'src/reducers/util';

const initialState = {};

export default createReducer({
  [fetchCollectionDiagrams.START]: (state, { id }) => objectLoadStart(state, id),

  [fetchCollectionDiagrams.ERROR]: (state, {
    error, args: { id },
  }) => objectLoadError(state, id, error),

  [fetchCollectionDiagrams.COMPLETE]: (state, {
    id, data,
  }) => objectLoadComplete(state, id, data),
}, initialState);
