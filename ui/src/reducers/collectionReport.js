import { createReducer } from 'redux-act';

import { fetchCollectionReport } from 'src/actions';
import { objectLoadStart, objectLoadError, objectLoadComplete } from 'src/reducers/util';

const initialState = {};

export default createReducer({
  [fetchCollectionReport.START]:
    (state, { id }) => objectLoadStart(state, id),

  [fetchCollectionReport.ERROR]:
    (state, { error, args: { id } }) => objectLoadError(state, id, error),

  [fetchCollectionReport.COMPLETE]:
    (state, { id, data }) => objectLoadComplete(state, id, data),
}, initialState);
