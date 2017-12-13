import { createReducer } from 'redux-act';
import { assign, assignWith } from 'lodash/fp';

import {
  fetchDocument,
  fetchSearchResults, fetchNextSearchResults,
  fetchChildDocs, fetchNextChildDocs,
} from 'src/actions';
import { normaliseSearchResult } from './util';

const initialState = {};

// Given a search result, remove the entities, keep the documents.
// Note this only updates the results list, not the total or other fields.
function filterOnlyDocuments(result) {
  const docsResult = { ...result };
  if (result.results) {
    docsResult.results = result.results
      .filter(object => object.schema === 'Document');
  }
  return docsResult;
}

function addObjectsFromResult(state, { result }) {
  // Obtain all objects contained in the search result (organised by id).
  const objects = normaliseSearchResult(result).objects;
  // The search results may contain only a subset of the document's fields, so
  // to not erase any existing value, we do a shallow merge of object fields.
  return assignWith(assign)(state, objects);
}

function addDocumentsFromResult(state, { result }) {
  // Note we must run filterOnlyDocuments before normalisation, because the ids
  // of documents and entities can collide.
  const docsResult = filterOnlyDocuments(result);
  return addObjectsFromResult(state, { result: docsResult });
}

export default createReducer({
    [fetchDocument.START]: (state, { id }) => ({
      ...state,
      [id]: { ...state[id], _isFetching: true },
    }),

    [fetchDocument.COMPLETE]: (state, { id, data }) => ({
      ...state,
      [id]: data,
    }),

    [fetchSearchResults.COMPLETE]: addDocumentsFromResult,
    [fetchNextSearchResults.COMPLETE]: addDocumentsFromResult,

    [fetchChildDocs.COMPLETE]: addObjectsFromResult,
    [fetchNextChildDocs.COMPLETE]: addObjectsFromResult,
}, initialState);
