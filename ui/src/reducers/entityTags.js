import { createReducer } from 'redux-act';

import { fetchEntityTags } from 'actions';
import { objectLoadStart, objectLoadError, objectLoadComplete } from 'reducers/util';

const initialState = {};

export default createReducer({
  [fetchEntityTags.START]: (state, { id }) => objectLoadStart(state, id),
  [fetchEntityTags.ERROR]:
    (state, { error, args: { id } }) => objectLoadError(state, id, error),
  [fetchEntityTags.COMPLETE]:
    (state, { id, data }) => objectLoadComplete(state, id, data),
}, initialState);
