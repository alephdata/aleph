import { createReducer } from 'redux-act';

import { queryNotifications } from '/src/actions/index.js';
import { resultObjects } from './util';

export default createReducer(
  {
    [queryNotifications.COMPLETE]: (state, { result }) =>
      resultObjects(state, result),
  },
  {}
);
