import { createReducer } from 'redux-act';

import { fetchSystemStatus } from 'actions';
import { loadState, loadStart, loadError, loadComplete } from 'reducers/util';

const initialState = loadState();

export default createReducer(
  {
    [fetchSystemStatus.START]: (state) => loadStart(state),
    [fetchSystemStatus.ERROR]: (state, { error }) => loadError(state, error),
    [fetchSystemStatus.COMPLETE]: (state, { status }) => loadComplete(status),
  },
  initialState
);
