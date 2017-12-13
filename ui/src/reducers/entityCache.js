import { createReducer } from 'redux-act';

import { fetchEntity } from 'src/actions';

const initialState = {};

export default createReducer({
  [fetchEntity.START]: (state, { id }) => ({
    ...state,
    [id]: { _isFetching: true },
  }),

  [fetchEntity.COMPLETE]: (state, { id, data }) => ({
    ...state,
    [id]: data,
  }),
}, initialState);
