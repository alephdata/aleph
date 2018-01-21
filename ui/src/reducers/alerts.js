import { createReducer } from 'redux-act';

import { fetchAlerts } from 'src/actions';

const initialState = {
    isLoaded: false,
};

export default createReducer({
    [fetchAlerts.START]: state => ({ isLoaded: false }),

    [fetchAlerts.COMPLETE]: (state, { alerts }) => ({
        ...alerts,
        isLoaded: true
    }),
}, initialState);
