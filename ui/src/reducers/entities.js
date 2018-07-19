import { createReducer } from 'redux-act';
import { set, unset, update } from 'lodash/fp';

import {
  queryEntities,
  fetchDocument,
  fetchEntity,
  deleteDocument
} from 'src/actions';
import { cacheResults } from './util';

const initialState = {};

export default createReducer({
    [fetchDocument.START]: (state, { id }) =>
      update(id, set('isLoading', true))(state),
    [fetchEntity.START]: (state, { id }) =>
      update(id, set('isLoading', true))(state),

    [fetchDocument.ERROR]: (state, { error, args: { id } }) =>
      set(id, { isLoading: false, isError: true, error: error })(state),
    [fetchEntity.ERROR]: (state, { error, args: { id } }) =>
      set(id, { isLoading: false, isError: true, error: error })(state),

    [fetchDocument.COMPLETE]: (state, { id, data }) =>
      set(id, data)(state),
    [fetchEntity.COMPLETE]: (state, { id, data }) =>
      set(id, data)(state),

    [queryEntities.COMPLETE]: cacheResults,

  [deleteDocument.COMPLETE]: (state, { id, data }) =>
    unset(id)(state),
}, initialState);
