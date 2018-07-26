import { createReducer } from 'redux-act';

import { fetchAlerts } from 'src/actions';

const initialState = {};

export default createReducer({
  [fetchAlerts.START]: state => ({
    ...state,
    isLoading: true,
    shouldLoad: false,
    isError: false
  }),
  [fetchAlerts.ERROR]: (state, { error }) => ({
    isLoading: false,
    shouldLoad: false,
    isError: true,
    error 
  }),
  [fetchAlerts.COMPLETE]: (state, { alerts }) => ({
    ...alerts
  }),
}, initialState);
