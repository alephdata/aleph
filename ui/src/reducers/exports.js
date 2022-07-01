import { createReducer } from 'redux-act';

import { fetchExports } from 'src/actions';
import {
  loadState,
  loadStart,
  loadError,
  loadComplete,
} from 'src/reducers/util';

const initialState = loadState();

export default createReducer(
  {
    [fetchExports.START]: (state) => loadStart(state),
    [fetchExports.ERROR]: (state, { error }) => loadError(state, error),
    [fetchExports.COMPLETE]: (state, { exports }) => loadComplete(exports),
  },
  initialState
);
