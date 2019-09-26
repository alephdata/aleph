import { createReducer } from 'redux-act';

import { fetchSystemStatus } from 'src/actions';

const initialState = {
  isLoaded: false,
  shouldLoad: true,
};

export default createReducer({
  [fetchSystemStatus.START]: state => ({
    ...state, isLoading: true, shouldLoad: false,
  }),

  [fetchSystemStatus.COMPLETE]: (state, { status }) => (status),
}, initialState);
