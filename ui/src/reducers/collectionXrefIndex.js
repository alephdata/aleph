import { createReducer } from 'redux-act';

import { fetchCollectionXrefIndex } from 'src/actions';
import { objectLoadStart, objectLoadError, objectLoadComplete } from 'src/reducers/util';

const initialState = {};

export default createReducer({
  [fetchCollectionXrefIndex.START]: (state, { id }) =>
    objectLoadStart(state, id),

  [fetchCollectionXrefIndex.ERROR]: (state, { error, args: { id } }) =>
    objectLoadError(state, id, error),

  [fetchCollectionXrefIndex.COMPLETE]: (state, { id, data }) =>
    objectLoadComplete(state, id, data),

}, initialState);
