import { assign, assignWith } from 'lodash/fp';

import { normaliseSearchResult } from './util';

const initialState = {};

const documentCache = (state = initialState, action) => {
  const { type, payload } = action;
  switch (type) {
    case 'FETCH_DOCUMENT_REQUEST':
      return { ...state, [payload.id]: { ...state[payload.id], _isFetching: true } };
    case 'FETCH_DOCUMENT_SUCCESS':
      return { ...state, [payload.id]: payload.data };
    case 'FETCH_CHILD_DOCS_SUCCESS':
    case 'FETCH_CHILD_DOCS_NEXT_SUCCESS':
      // Search results contain only a subset of the document's fields, so we
      // avoid erasing the existing value. A shallow merge of fields should do.
      return assignWith(assign)(state, normaliseSearchResult(payload.result).objects);
    default:
      return state;
  }
};

export default documentCache;
