import { createReducer } from 'redux-act';

import { fetchSystemStatus } from '/src/actions/index.js';
import {
  loadState,
  loadStart,
  loadError,
  loadComplete,
} from '/src/reducers/util.js';

const initialState = loadState();

export default createReducer(
  {
    [fetchSystemStatus.START]: (state) => loadStart(state),
    [fetchSystemStatus.ERROR]: (state, { error }) => loadError(state, error),
    [fetchSystemStatus.COMPLETE]: (state, { status }) => loadComplete(status),
  },
  initialState
);
