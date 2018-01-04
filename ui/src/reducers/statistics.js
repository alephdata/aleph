import { createReducer } from 'redux-act';

import { fetchStatistics } from 'src/actions';

const initialState = {
    isLoaded: false,
};

export default createReducer({
    [fetchStatistics.START]: state => ({ isLoaded: false }),

    [fetchStatistics.COMPLETE]: (state, { statistics }) => ({
        ...statistics,
        isLoaded: true
    }),
}, initialState);
