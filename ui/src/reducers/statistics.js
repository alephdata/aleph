import { createReducer } from 'redux-act';

import { fetchMetadata, fetchStatistics } from 'src/actions';

const initialState = {
    isLoading: true,
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

    [fetchMetadata.COMPLETE]: (state, { metadata }) => ({
      ...metadata.statistics,
      isLoading: false
    }),
}, initialState);
