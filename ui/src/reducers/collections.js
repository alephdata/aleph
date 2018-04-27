import { createReducer } from 'redux-act';
import { set, update } from 'lodash/fp';

import { fetchCollection, updateCollection, queryCollections, createCollection, deleteCollection } from 'src/actions';
import { cacheResults } from './util';

const initialState = {};

export default createReducer({
  [queryCollections.COMPLETE]: cacheResults,

  [fetchCollection.START]: (state, { id }) =>
    update(id, set('isLoading', true))(state),

  [fetchCollection.ERROR]: (state, { error, args: { id } }) =>
    set(id, { isLoading: false, isError: true, error: error })(state),

  [fetchCollection.COMPLETE]: (state, { id, data }) =>
    set(id, data)(state),

  [updateCollection.COMPLETE]: (state, { id, data }) =>
    set(id, data)(state),

  [createCollection.COMPLETE]: (state, { data }) =>
    set(data)(state),

  [deleteCollection.COMPLETE]: (state, { data }) =>
  set(data)(state),
}, initialState);
