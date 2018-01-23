import { createReducer } from 'redux-act';

import { fetchAlerts, deleteAlert, addAlert } from 'src/actions';

const initialState = {
    isLoaded: false,
};

export default createReducer({
    [fetchAlerts.START]: state => ({ isLoaded: false }),
    [deleteAlert.START]: state => ({ isLoaded: false }),
    [addAlert.START]: state => ({ isLoaded: false }),

    [fetchAlerts.COMPLETE]: (state, { alerts }) => ({
        ...alerts,
        isLoaded: true
    }),
    [deleteAlert.COMPLETE]: (state, { alerts }) => ({
        ...alerts,
        isLoaded: true
    }),
    [addAlert.COMPLETE]: (state, { alerts }) => ({
        ...alerts,
        isLoaded: true
    }),
}, initialState);
