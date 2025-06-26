import { createReducer } from 'redux-act';

import { fetchStatistics } from '/src/actions/index.js';
import {
  loadState,
  loadStart,
  loadError,
  loadComplete,
} from '/src/reducers/util.js';

const initialState = loadState();

export default createReducer(
  {
    [fetchStatistics.START]: (state) => loadStart(state),
    [fetchStatistics.ERROR]: (state, { error }) => loadError(state, error),
    [fetchStatistics.COMPLETE]: (state, { statistics }) =>
      loadComplete(statistics),
  },
  initialState
);
