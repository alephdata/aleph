import { createReducer } from 'redux-act';

import { queryNotifications } from 'actions';
import { resultObjects } from './util';

export default createReducer(
  {
    [queryNotifications.COMPLETE]: (state, { result }) =>
      resultObjects(state, result),
  },
  {}
);
