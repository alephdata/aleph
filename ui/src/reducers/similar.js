import { createReducer } from 'redux-act';

import { querySimilar } from '/src/actions/index.js';
import { resultObjects } from '/src/reducers/util.js';

const initialState = {};

export default createReducer(
  {
    [querySimilar.COMPLETE]: (state, { result }) =>
      resultObjects(state, result),
  },
  initialState
);
