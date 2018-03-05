import { createReducer } from 'redux-act';

import { fetchAlerts } from 'src/actions';

const initialState = {};

export default createReducer({
  [fetchAlerts.COMPLETE]: (state, { alerts }) => ({
    ...alerts
  }),
}, initialState);
