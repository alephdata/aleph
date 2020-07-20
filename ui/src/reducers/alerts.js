import { createReducer } from 'redux-act';

import { fetchAlerts } from 'actions';
import { loadState, loadStart, loadError, loadComplete } from 'reducers/util';

const initialState = loadState();

export default createReducer({
  [fetchAlerts.START]: state => loadStart(state),
  [fetchAlerts.ERROR]: (state, { error }) => loadError(state, error),
  [fetchAlerts.COMPLETE]: (state, { alerts }) => loadComplete(alerts),
}, initialState);
