import { assign, assignWith, keyBy } from 'lodash/fp';
const initialState = {};

const documentCache = (state = initialState, action) => {
  const { type, payload } = action;
  switch (type) {
    case 'FETCH_DOCUMENT_REQUEST':
      return { ...state, [payload.id]: { _isFetching: true } };
    case 'FETCH_DOCUMENT_SUCCESS':
      return { ...state, [payload.id]: payload.data };
    case 'FETCH_CHILD_DOCS_SUCCESS':
      return {
        ...state,
        [payload.id]: {
          ...state[payload.id],
          childDocIdsResult: mergeResults(state[payload.id].childDocIdsResult, payload.data),
        },
      };
    case 'SEARCH_DOCUMENTS_SUCCESS':
      // Search results contain only a subset of the document's fields, so we
      // avoid erasing the existing value. A shallow merge of fields should do.
      return assignWith(assign)(state, docsFromSearchResult(payload.data));
    default:
      return state;
  }
};

function docsFromSearchResult(result) {
  return keyBy('id')(result.results);
}

function mergeResults(oldResult, newResult) {
  return {
    next: newResult.next,
    total: newResult.total,
    results: (oldResult ? oldResult.results : []).concat(newResult.results),
  }
}

export default documentCache;
