import { createReducer } from 'redux-act';
import { assign, set, update } from 'lodash/fp';

import {
  fetchSearchResults,
  fetchNextSearchResults
} from 'src/actions';

// a mapping of query string to result object.
const initialState = {};

// prevResult is to be passed explicitly to appendResults, even though it should
// normally equal the current result; this is just for in case we e.g.
// accidentally trigger multiple fetches.
function combineResults(state, { query, prevResult, nextResult }) {
  // We store the next result, but with the previous (= current) results
  // prepended. Note that result attributes like 'page' and 'limit' will be
  // confusing now, but we do not use them anyway.
  const totalResult = {
    ...nextResult,
    results: [ ...prevResult.results, ...nextResult.results],
  }

  return set([query.toString()], totalResult)(state);
}

export default createReducer({
  [fetchSearchResults.START]: (state, { query }) =>
    set([query.toString()], { isFetching: true })(state),

  [fetchSearchResults.COMPLETE]: (state, { query, result }) =>
    set([query.toString()], result)(state),

  [fetchNextSearchResults.START]: (state, { query }) =>
    update([query.toString()], assign({ isExpanding: true }))(state),

  [fetchNextSearchResults.COMPLETE]: combineResults,
}, initialState);
