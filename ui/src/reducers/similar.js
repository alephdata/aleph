// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
//
// SPDX-License-Identifier: MIT

import { createReducer } from 'redux-act';

import {
    queryEntities,
    queryEntitySetEntities,
    fetchEntity,
    createEntity,
    updateEntity,
    deleteEntity,
} from 'actions';
import {
    objectLoadStart, objectLoadError, objectLoadComplete, objectDelete, resultObjects,
} from 'reducers/util';

const initialState = {};

export default createReducer({

    [querySimilar.COMPLETE]: (state, { result }) => resultObjects(state, result),

}, initialState);
