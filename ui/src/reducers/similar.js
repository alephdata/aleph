import { createReducer } from 'redux-act';

import { querySimilar } from 'actions';
import { resultObjects } from 'reducers/util';

const initialState = {};

export default createReducer({

    [querySimilar.COMPLETE]: (state, { result }) => resultObjects(state, result),

}, initialState);
