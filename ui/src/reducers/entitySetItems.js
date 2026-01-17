import { createReducer } from 'redux-act';

import {
  queryEntitySetItems,
  updateEntitySetItemMutate,
  updateEntitySetItemNoMutate,
} from '/src/actions/index.js';
import { objectLoadComplete, resultObjects } from '/src/reducers/util.js';

const initialState = {};

export default createReducer(
  {
    [queryEntitySetItems.COMPLETE]: (state, { result }) =>
      resultObjects(state, result),

    [updateEntitySetItemMutate.COMPLETE]: (state, { data }) =>
      objectLoadComplete(state, data.id, data),

    [updateEntitySetItemNoMutate.COMPLETE]: (state, { data }) =>
      objectLoadComplete(state, data.id, data),
  },
  initialState
);
