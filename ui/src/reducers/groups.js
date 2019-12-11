import { createReducer } from 'redux-act';

import { fetchGroups } from 'src/actions';
import { loadState, loadStart, loadError, loadComplete } from 'src/reducers/util';

const initialState = loadState();

export default createReducer({
  [fetchGroups.START]: (state) => loadStart(state),
  [fetchGroups.ERROR]: (state, { error }) => loadError(state, error),
  [fetchGroups.COMPLETE]: (state, { data }) => loadComplete(data),
}, initialState);
