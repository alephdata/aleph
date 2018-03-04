import { createReducer } from 'redux-act';

import { fetchStatistics } from 'src/actions';

const initialState = {
    isLoading: false,
};

export default createReducer({
    [fetchStatistics.START]: state => ({
      ...state,
      isLoading: true
    }),

    [fetchStatistics.COMPLETE]: (state, { statistics }) => ({
      ...statistics,
      isLoading: false
    }),
}, initialState);
