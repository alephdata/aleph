import { createReducer } from 'redux-act';

import { queryNearby } from 'actions';
import { resultObjects } from 'reducers/util';

const initialState = {};

export default createReducer(
  {
    [queryNearby.COMPLETE]: (state, { result }) => resultObjects(state, result),
  },
  initialState
);
