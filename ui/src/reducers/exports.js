// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
//
// SPDX-License-Identifier: MIT

import { createReducer } from "redux-act";

import { fetchExports } from "src/actions";
import {
  loadState,
  loadStart,
  loadError,
  loadComplete,
} from "src/reducers/util";

const initialState = loadState();

export default createReducer(
  {
    [fetchExports.START]: (state) => loadStart(state),
    [fetchExports.ERROR]: (state, { error }) => loadError(state, error),
    [fetchExports.COMPLETE]: (state, { exports }) => loadComplete(exports),
  },
  initialState
);
