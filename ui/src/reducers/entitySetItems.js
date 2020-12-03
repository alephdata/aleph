import { createReducer } from 'redux-act';

import { queryEntitySetItems, updateEntitySetItem } from 'actions';
import { objectLoadComplete, resultObjects } from 'reducers/util';

const initialState = {};

export default createReducer({
    [queryEntitySetItems.COMPLETE]: (state, { result }) => resultObjects(state, result),

    [updateEntitySetItem.COMPLETE]: (state, { data }) => objectLoadComplete(state, data.id, data),

}, initialState);
