import { createReducer } from 'redux-act';
import { set, update } from 'lodash/fp';

import { fetchCollectionXrefIndex } from 'src/actions';

const initialState = {};

export default createReducer({
  [fetchCollectionXrefIndex.START]: (state, { id }) =>
    update(id, set('isLoading', true))(state),

  [fetchCollectionXrefIndex.ERROR]: (state, { id }) =>
    update(id, set('isLoading', false))(state),

  [fetchCollectionXrefIndex.COMPLETE]: (state, { id, data }) =>
    set(id, data)(state),

}, initialState);
