import { createReducer } from 'redux-act';

import { fetchStatistics } from 'src/actions';

const initialState = {};

export default createReducer({
  [fetchStatistics.COMPLETE]: (state, { statistics }) => (statistics),
}, initialState);
