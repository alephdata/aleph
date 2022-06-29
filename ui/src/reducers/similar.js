// SPDX-FileCopyrightText: 2014 2014 Emma Prest, <emma@occrp.org> et al.
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
