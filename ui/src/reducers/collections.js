import { createReducer } from 'redux-act';

import { fetchCollectionsPage } from 'src/actions';
import { normaliseSearchResult } from './util';

const initialState = {};

export default createReducer({
  [fetchCollectionsPage.COMPLETE]: (state, { result }) => ({
    ...state,
    ...normaliseSearchResult(result).objects,
  }),
}, initialState);
