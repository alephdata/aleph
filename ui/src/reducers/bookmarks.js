import { createReducer } from 'redux-act';
import { queryBookmarks } from 'actions';
import { resultObjects } from './util';

const initialState = {};

export default createReducer(
  {
    [queryBookmarks.COMPLETE]: (state, { result }) =>
      resultObjects(state, result),
  },
  initialState
);
