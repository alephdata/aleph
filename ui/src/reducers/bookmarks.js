import { createReducer } from 'redux-act';
import { queryBookmarks } from '/src/actions/index.js';
import { resultObjects } from './util';

const initialState = {};

export default createReducer(
  {
    [queryBookmarks.COMPLETE]: (state, { result }) =>
      resultObjects(state, result),
  },
  initialState
);
