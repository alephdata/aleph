import { createReducer } from 'redux-act';
import uniq from 'lodash/uniq';

import { fetchChildDocs, fetchNextChildDocs } from 'src/actions';
import { normaliseSearchResult } from './util';

const initialState = {};

export default createReducer({
  [fetchChildDocs.START]: (state, { id }) => ({
    ...state,
    [id]: { ...state[id], isFetching: true },
  }),

  [fetchChildDocs.COMPLETE]: (state, { id, result }) => ({
    ...state,
    [id]: normaliseSearchResult(result).result,
  }),

  [fetchNextChildDocs.START]: (state, { id }) => ({
    ...state,
    [id]: { ...state[id], isFetchingNext: true },
  }),

  [fetchNextChildDocs.COMPLETE]: (state, { id, result }) => ({
    ...state,
    [id]: {
      ...mergeResults(state[id], normaliseSearchResult(result).result),
      isFetchingNext: false,
    },
  }),
}, initialState);

function mergeResults(oldResult, newResult) {
  return {
    next: newResult.next,
    total: newResult.total,
    // uniq should not be necessary, but included just in case.
    results: uniq((oldResult ? oldResult.results : []).concat(newResult.results)),
  };
}
