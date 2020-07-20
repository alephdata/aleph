import { createReducer } from 'redux-act';

import { fetchEntityTags } from 'actions';

const initialState = {};

export default createReducer({

  [fetchEntityTags.COMPLETE]: (state, { data }) => {
    const values = {};
    data.results.forEach((res) => {
      values[`${res.field}:${res.value}`] = res.count;
    });
    return { ...values, ...state };
  },

}, initialState);
