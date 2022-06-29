// SPDX-FileCopyrightText: 2014 2014 Emma Prest, <emma@occrp.org> et al.
//
// SPDX-License-Identifier: MIT

import { createReducer } from 'redux-act';

import { fetchEntityTags, fetchProfileTags } from 'actions';

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

export default createReducer({

  [fetchEntityTags.COMPLETE]: updateState,
  [fetchProfileTags.COMPLETE]: updateState,

}, initialState);
