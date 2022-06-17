// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
//
// SPDX-License-Identifier: MIT

import { createReducer } from 'redux-act';

import { queryEntitySetItems, updateEntitySetItemMutate, updateEntitySetItemNoMutate } from 'actions';
import { objectLoadComplete, resultObjects } from 'reducers/util';

const initialState = {};

export default createReducer({
    [queryEntitySetItems.COMPLETE]: (state, { result }) => resultObjects(state, result),

    [updateEntitySetItemMutate.COMPLETE]: (state, { data }) => objectLoadComplete(state, data.id, data),

    [updateEntitySetItemNoMutate.COMPLETE]: (state, { data }) => objectLoadComplete(state, data.id, data),

}, initialState);
