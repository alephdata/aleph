import { createReducer } from 'redux-act';
import { assign, assignWith, set, update } from 'lodash/fp';

import {
  fetchDocument, fetchEntity,
  fetchSearchResults, fetchNextSearchResults,
  fetchChildDocs, fetchNextChildDocs,
} from 'src/actions';
import { normaliseSearchResult } from './util';

const initialState = {};

function addObjectsFromResult(state, { result }) {
  // Obtain all objects contained in the search result (organised by id).
  const objects = normaliseSearchResult(result).objects;
  // The search results may contain only a subset of the object's fields, so
  // to not erase any existing value, we do a shallow merge of object fields.
  return assignWith(assign)(state, objects);
}

export default createReducer({
    [fetchDocument.START]: (state, { id }) =>
      update(id, set('_isFetching', true))(state),
    [fetchEntity.START]: (state, { id }) =>
      update(id, set('_isFetching', true))(state),

    [fetchDocument.COMPLETE]: (state, { id, data }) =>
      set(id, data)(state),
    [fetchEntity.COMPLETE]: (state, { id, data }) =>
      set(id, data)(state),

    [fetchSearchResults.COMPLETE]: addObjectsFromResult,
    [fetchNextSearchResults.COMPLETE]: addObjectsFromResult,
    [fetchChildDocs.COMPLETE]: addObjectsFromResult,
    [fetchNextChildDocs.COMPLETE]: addObjectsFromResult,
}, initialState);
