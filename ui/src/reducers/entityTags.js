import { createReducer } from 'redux-act';

import { fetchEntityTags, fetchProfileTags } from '/src/actions/index.js';
import {
  objectLoadStart,
  objectLoadError,
  objectLoadComplete,
} from '/src/reducers/util.js';

const initialState = {};

export default createReducer(
  {
    [fetchEntityTags.START]: (state, { id }) => objectLoadStart(state, id),
    [fetchEntityTags.ERROR]: (state, { error, args: { id } }) =>
      objectLoadError(state, id, error),
    [fetchEntityTags.COMPLETE]: (state, { id, data }) =>
      objectLoadComplete(state, id, data),

    [fetchProfileTags.START]: (state, { id }) => objectLoadStart(state, id),
    [fetchProfileTags.ERROR]: (state, { error, args: { id } }) =>
      objectLoadError(state, id, error),
    [fetchProfileTags.COMPLETE]: (state, { id, data }) =>
      objectLoadComplete(state, id, data),
  },
  initialState
);
