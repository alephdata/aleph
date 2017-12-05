import { assign, assignWith, keyBy } from 'lodash/fp';
const initialState = {};

const documentCache = (state = initialState, action) => {
  const { type, payload } = action;
  switch (type) {
    case 'FETCH_DOCUMENT_REQUEST':
      return { ...state, [payload.id]: { _isFetching: true } };
    case 'FETCH_DOCUMENT_SUCCESS':
      return { ...state, [payload.id]: payload.data };
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

export default documentCache;
