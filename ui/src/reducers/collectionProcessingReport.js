import { createReducer } from 'redux-act';

import { fetchCollectionProcessingReport } from 'src/actions';
import { objectLoadStart, objectLoadError, objectLoadComplete } from 'src/reducers/util';

const initialState = {};

export default createReducer({
  [fetchCollectionProcessingReport.START]:
    (state, { id }) => objectLoadStart(state, id),

  [fetchCollectionProcessingReport.ERROR]:
    (state, { error, args: { id } }) => objectLoadError(state, id, error),

  [fetchCollectionProcessingReport.COMPLETE]:
    (state, { id, data }) => objectLoadComplete(state, id, data),
}, initialState);
