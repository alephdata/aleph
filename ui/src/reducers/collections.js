import { createReducer } from 'redux-act';
import { set, update } from 'lodash/fp';

import { fetchCollection, fetchCollections } from 'src/actions';
import { mapById } from './util';

const initialState = {};

export default createReducer({
  [fetchCollections.COMPLETE]: (state, { result }) => ({
    ...state,
    ...mapById(result),
  }),

  [fetchCollection.START]: (state, { id }) =>
    update(id, set('isFetching', true))(state),

  [fetchCollection.COMPLETE]: (state, { id, data }) =>
    set(id, data)(state),
}, initialState);
