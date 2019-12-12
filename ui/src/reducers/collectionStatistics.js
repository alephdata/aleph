import { createReducer } from 'redux-act';

import {
  fetchCollectionStatistics,
} from 'src/actions';
import {
  objectLoadStart, objectLoadError, objectLoadComplete,
} from 'src/reducers/util';

const initialState = {};

export default createReducer({
  [fetchCollectionStatistics.START]: (state, { id }) => objectLoadStart(state, id),
  [fetchCollectionStatistics.ERROR]:
    (state, { error, args: { id } }) => objectLoadError(state, id, error),
  [fetchCollectionStatistics.COMPLETE]:
    (state, { id, data }) => objectLoadComplete(state, id, data),
}, initialState);
