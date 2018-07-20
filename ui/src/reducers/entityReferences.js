import { createReducer } from 'redux-act';

import { fetchEntityReferences } from 'src/actions';
import { objectLoadStart, objectLoadError, objectLoadComplete } from 'src/reducers/util';

const initialState = {};

export default createReducer({
  [fetchEntityReferences.START]: (state, { id }) =>
    objectLoadStart(state, id),

  [fetchEntityReferences.ERROR]: (state, { error, args: { id } }) =>
    objectLoadError(state, id, error),

  [fetchEntityReferences.COMPLETE]: (state, { id, data }) =>
    objectLoadComplete(state, id, data),

}, initialState);
