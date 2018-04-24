import { createReducer } from 'redux-act';

import { fetchMetadata } from 'src/actions';

const initialState = {
  isLoaded: false,
};

export default createReducer({
  [fetchMetadata.START]: state => ({ isLoading: true }),
  [fetchMetadata.ERROR]: state => ({ isLoading: false }),
  [fetchMetadata.COMPLETE]: (state, { metadata }) => ({
    ...metadata,
    isLoading: false
  }),
}, initialState);
