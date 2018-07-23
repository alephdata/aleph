import { createReducer } from 'redux-act';

import { queryNotifications } from 'src/actions';
import { resultObjects } from './util';

const initialState = {};

export default createReducer({
  [queryNotifications.COMPLETE]: (state, { result }) =>
    resultObjects(state, result),

}, initialState);
