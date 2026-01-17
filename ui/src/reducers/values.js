import { createReducer } from 'redux-act';

import { fetchEntityTags, fetchProfileTags } from '/src/actions/index.js';

const initialState = {};

function updateState(state, { data }) {
  const values = {};
  if (!data?.results?.length) {
    return state;
  }
  data.results.forEach((res) => {
    values[`${res.field}:${res.value}`] = res.count;
  });
  return { ...values, ...state };
}

export default createReducer(
  {
    [fetchEntityTags.COMPLETE]: updateState,
    [fetchProfileTags.COMPLETE]: updateState,
  },
  initialState
);
