import { createReducer } from 'redux-act';
import { assign, assignWith, set, update } from 'lodash/fp';

import {
  fetchDocument,
  fetchEntity,
  fetchSearchResults,
  fetchNextSearchResults,
  fetchChildDocs,
  fetchNextChildDocs,
} from 'src/actions';
import { mapById } from './util';

const initialState = {};

function cacheResultEntities(state, { result }) {
  // The search results may contain only a subset of the object's fields, so
  // to not erase any existing value, we do a shallow merge of object fields.
  return assignWith(assign)(state, mapById(result));
}

export default createReducer({
    [fetchDocument.START]: (state, { id }) =>
      update(id, set('isFetching', true))(state),
    [fetchEntity.START]: (state, { id }) =>
      update(id, set('isFetching', true))(state),

    [fetchDocument.COMPLETE]: (state, { id, data }) =>
      set(id, data)(state),
    [fetchEntity.COMPLETE]: (state, { id, data }) =>
      set(id, data)(state),

    [fetchSearchResults.COMPLETE]: cacheResultEntities,
    [fetchNextSearchResults.COMPLETE]: cacheResultEntities,
    [fetchChildDocs.COMPLETE]: cacheResultEntities,
    [fetchNextChildDocs.COMPLETE]: cacheResultEntities,
}, initialState);
