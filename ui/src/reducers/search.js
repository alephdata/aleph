import { createReducer } from 'redux-act';
import { assign, set, update } from 'lodash/fp';

import {
  fetchSearchResults,
  fetchNextSearchResults,
} from 'src/actions';
import { queryToResultKey } from 'src/selectors';

// a mapping of query string to result object
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

  return set([queryToResultKey(query)], totalResult)(state);
}

export default createReducer({
  [fetchSearchResults.START]: (state, { query }) =>
    set([queryToResultKey(query)], { isFetching: true })(state),

  [fetchSearchResults.COMPLETE]: (state, { query, result }) =>
    set([queryToResultKey(query)], result)(state),

  // Upon error, leave some error status.
  [fetchSearchResults.ERROR]: (state, { args: { query } }) =>
    set([queryToResultKey(query)], { status: 'error' })(state),

  [fetchNextSearchResults.START]: (state, { query }) =>
    update([queryToResultKey(query)], assign({ isExpanding: true }))(state),

  [fetchNextSearchResults.COMPLETE]: combineResults,

  // Upon error, merely reset the isExpanding flag.
  [fetchNextSearchResults.ERROR]: (state, { args: { query, result } }) =>
    update([queryToResultKey(query)], assign({ isExpanding: false }))(state),
}, initialState);
