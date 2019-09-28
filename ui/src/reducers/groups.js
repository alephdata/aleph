import { createReducer } from 'redux-act';

import { fetchGroups } from 'src/actions';

const initialState = {
  shouldLoad: true,
  isLoading: false,
  isError: false,
};

export default createReducer({
  [fetchGroups.START]: () => ({ isLoading: true, shouldLoad: false }),

  [fetchGroups.ERROR]: (state, { error }) => ({
    shouldLoad: false,
    isLoading: false,
    isError: true,
    error,
  }),

  [fetchGroups.COMPLETE]: (state, { data }) => ({
    ...data,
    shouldLoad: false,
    isLoading: false,
    isError: false,
  }),
}, initialState);
