import { assign, assignWith } from 'lodash/fp';

import {
  fetchDocument,
  fetchSearchResults, fetchNextSearchResults,
  fetchChildDocs, fetchChildDocsNext,
} from 'src/actions';
import { normaliseSearchResult } from './util';

const initialState = {};

const documentCache = (state = initialState, action) => {
  const { type, payload } = action;
  switch (type) {
    case fetchDocument.START:
      return { ...state, [payload.id]: { ...state[payload.id], _isFetching: true } };
    case fetchDocument.COMPLETE:
      return { ...state, [payload.id]: payload.data };
    case fetchSearchResults.COMPLETE:
    case fetchNextSearchResults.COMPLETE: {
      // Extract and cache the documents found in the search results.
      // Note we must run filterOnlyDocuments before normalisation, because the
      // ids of documents and entities can collide.
      const docsResult = filterOnlyDocuments(payload.result);
      const newResults = normaliseSearchResult(docsResult).objects;
      // Search results contain only a subset of the document's fields, so we
      // avoid erasing the existing value. A shallow merge of fields should do.
      return assignWith(assign)(state, newResults);
    }
    case fetchChildDocs.COMPLETE:
    case fetchChildDocsNext.COMPLETE: {
      const newResults = normaliseSearchResult(payload.result).objects;
      // Use shallow merge like above.
      return assignWith(assign)(state, newResults);
    }
    default:
      return state;
  }
};

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

export default documentCache;
