import { createReducer } from 'redux-act';
import { set } from 'lodash/fp';

import { fetchCollectionXrefMatches } from 'src/actions';

const initialState = {};

export default createReducer({
  [fetchCollectionXrefMatches.COMPLETE]: (state, { id, otherId, data }) =>
    set(id, data)(state),

}, initialState);
