import { createReducer } from 'redux-act';

import { fetchStatistics } from 'src/actions';
import { loadState, loadStart, loadError, loadComplete } from 'src/reducers/util';

const initialState = loadState();

export default createReducer({
  [fetchStatistics.START]: (state) => loadStart(state),
  [fetchStatistics.ERROR]: (state, { error }) => loadError(state, error),
  [fetchStatistics.COMPLETE]: (state, { statistics }) => loadComplete(statistics),
}, initialState);
