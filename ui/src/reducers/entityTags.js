import { createReducer } from 'redux-act';

import { fetchEntityTags } from 'src/actions';
import { objectLoadStart, objectLoadError, objectLoadComplete } from 'src/reducers/util';

const initialState = {};

export default createReducer({
  [fetchEntityTags.START]: (state, { id }) =>
    objectLoadStart(state, id),

  [fetchEntityTags.ERROR]: (state, { error, args: { id } }) =>
    objectLoadError(state, id),

  [fetchEntityTags.COMPLETE]: (state, { id, data }) =>
    objectLoadComplete(state, id, data),

}, initialState);
