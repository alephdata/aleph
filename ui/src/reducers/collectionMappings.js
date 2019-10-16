import { createReducer } from 'redux-act';

import { fetchCollectionMappings } from 'src/actions';
import { objectLoadStart, objectLoadError, objectLoadComplete } from 'src/reducers/util';

const initialState = {};

export default createReducer({
  [fetchCollectionMappings.START]: (state, { id }) => objectLoadStart(state, id),

  [fetchCollectionMappings.ERROR]: (state, {
    error, args: { id },
  }) => objectLoadError(state, id, error),

  [fetchCollectionMappings.COMPLETE]: (state, {
    id, data,
  }) => objectLoadComplete(state, id, data),
}, initialState);
