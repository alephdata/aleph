// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
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
