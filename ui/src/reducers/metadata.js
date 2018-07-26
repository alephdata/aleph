import { createReducer } from 'redux-act';
import { fetchMetadata } from 'src/actions';

const initialState = {
  isLoaded: false,
};

export default createReducer({
  [fetchMetadata.START]: (state) => 
    ({ isLoading: true, isError: false }),

  [fetchMetadata.ERROR]: (state, { error }) => ({
    isLoading: false,
    isError: true,
    error 
  }),

  [fetchMetadata.COMPLETE]: (state, { metadata }) => ({
    ...metadata,
    isLoading: false,
    isError: false
  }),

}, initialState);
