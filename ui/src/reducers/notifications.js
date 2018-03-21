import { createReducer } from 'redux-act';

import { queryNotifications } from 'src/actions';
import { cacheResults } from './util';

const initialState = {};

export default createReducer({
  [queryNotifications.COMPLETE]: cacheResults,
}, initialState);
