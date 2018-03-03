import { createReducer } from 'redux-act';
import { set } from 'lodash/fp';

import { fetchFacet } from 'src/actions';

const initialState = {};

export default createReducer({

  [fetchFacet.COMPLETE]: (state, { query, result }) =>
    set([query.toKey()], result.facets)(state),

}, initialState);
