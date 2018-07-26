import { createReducer } from 'redux-act';

import { fetchMetadata, fetchStatistics } from 'src/actions';

const initialState = {};

export default createReducer({
    [fetchStatistics.COMPLETE]: (state, { statistics }) => ({
      ...statistics
    }),

    [fetchMetadata.COMPLETE]: (state, { metadata }) => ({
      ...metadata.statistics,
      shouldLoad: true
    }),
}, initialState);
