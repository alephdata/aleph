import { createReducer } from 'redux-act';
import { set } from 'lodash/fp';

import { fetchCollectionXrefMatches } from 'src/actions';
import { matchesKey } from 'src/selectors';

const initialState = {};

export default createReducer({
  [fetchCollectionXrefMatches.COMPLETE]: (state, { id, otherId, data }) =>
    set(matchesKey(id, otherId), data)(state),
}, initialState);
