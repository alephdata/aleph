import { createReducer } from 'redux-act';

import { fetchAlerts } from 'src/actions';

const initialState = {};

export default createReducer({
  [fetchAlerts.START]: state => ({
    ...state,
    isLoading: true,
    isError: false
  }),
  [fetchAlerts.ERROR]: (state, { error }) => ({
    isLoading: false,
    isError: true,
    error 
  }),
  [fetchAlerts.COMPLETE]: (state, { alerts }) => ({
    ...alerts
  }),
}, initialState);
