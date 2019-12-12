import { createReducer } from 'redux-act';

import { fetchGroups } from 'src/actions';
import { resultObjects } from './util';

const initialState = {};

export default createReducer({
  [fetchGroups.COMPLETE]: (state, { data }) => resultObjects(state, data),
}, initialState);
