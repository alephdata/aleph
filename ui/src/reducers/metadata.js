import { createReducer } from 'redux-act';
import { fetchMetadata } from 'src/actions';
import { loadState, loadStart, loadError, loadComplete } from 'src/reducers/util';

const initialState = loadState();

export default createReducer({
  [fetchMetadata.START]: (state) => loadStart(state),
  [fetchMetadata.ERROR]: (state, { error }) => loadError(state, error),
  [fetchMetadata.COMPLETE]: (state, { metadata }) => loadComplete(metadata),
}, initialState);
