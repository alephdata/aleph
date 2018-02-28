import { createReducer } from 'redux-act';
import { set } from 'lodash/fp';

import { fetchCollectionXrefIndex } from 'src/actions';

const initialState = {};

export default createReducer({
  [fetchCollectionXrefIndex.COMPLETE]: (state, { id, data }) =>
    set(id, data)(state),

}, initialState);
