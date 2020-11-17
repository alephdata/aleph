import { createReducer } from 'redux-act';

import { queryCollectionXref } from 'actions';
import { resultObjects } from './util';

export default createReducer({
  [queryCollectionXref.COMPLETE]: (state, { result }) => resultObjects(state, result)
}, {});
