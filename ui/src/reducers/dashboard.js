import { createReducer } from 'redux-act';

import { queryDashboard } from 'src/actions';
import { resultObjects } from './util';

const initialState = {};

export default createReducer({
  [queryDashboard.COMPLETE]: (state, { result }) => resultObjects(state, result),
}, initialState);
