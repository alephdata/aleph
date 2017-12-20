import { createReducer } from 'redux-act';

import { fetchCollectionsPage } from 'src/actions';
import { mapById } from './util';

const initialState = {};

export default createReducer({
  [fetchCollectionsPage.COMPLETE]: (state, { result }) => ({
    ...state,
    ...mapById(result),
  }),
}, initialState);
