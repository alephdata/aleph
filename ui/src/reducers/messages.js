import { createReducer } from 'redux-act';
import { fetchMessages } from 'actions';
import { loadState, loadStart, loadError, loadComplete } from 'reducers/util';

const initialState = loadState();

export default createReducer(
  {
    [fetchMessages.START]: (state) => loadStart(state),
    [fetchMessages.ERROR]: (state, { error }) => loadError(state, error),
    [fetchMessages.COMPLETE]: (state, messages) => loadComplete(messages),
  },
  initialState
);
