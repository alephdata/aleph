import uniq from 'lodash/uniq';

import { fetchChildDocs, fetchChildDocsNext } from 'src/actions';
import { normaliseSearchResult } from './util';

const initialState = {};

const documentChildrenResults = (state = initialState, action) => {
  const { type, payload } = action;
  switch (type) {
    case fetchChildDocs.START:
      return {
        ...state,
        [payload.id]: { ...state[payload.id], isFetching: true },
      };
    case fetchChildDocs.COMPLETE:
      return {
        ...state,
        [payload.id]: normaliseSearchResult(payload.result).result,
      };
    case fetchChildDocsNext.START:
      return {
        ...state,
        [payload.id]: { ...state[payload.id], isFetchingNext: true },
      }
    case fetchChildDocsNext.COMPLETE:
      return {
        ...state,
        [payload.id]: {
          ...mergeResults(state[payload.id] || {}, normaliseSearchResult(payload.result).result),
          isFetchingNext: false,
        },
      };
    default:
      return state;
  }
};

function mergeResults(oldResult, newResult) {
  return {
    next: newResult.next,
    total: newResult.total,
    // uniq should not be necessary, but included just in case.
    results: uniq((oldResult ? oldResult.results : []).concat(newResult.results)),
  };
}

export default documentChildrenResults;
