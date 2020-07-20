import { createReducer } from 'redux-act';

import { queryCollectionXref, decideCollectionXref } from 'actions';
import { resultObjects, objectLoadComplete } from './util';

export default createReducer({
  [queryCollectionXref.COMPLETE]: (state, { result }) => resultObjects(state, result),
  [decideCollectionXref.COMPLETE]: (state, { id, data }) => objectLoadComplete(state, id, data),
}, {});
