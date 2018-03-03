import { createReducer } from 'redux-act';
import { set, update } from 'lodash/fp';

import {
  queryCollections,
  fetchSearchResults,
  fetchNextSearchResults
} from 'src/actions';

const initialState = {};

function updateResults(state, { query, result }) {
  const key = query.toKey(),
        previous = state[key] || {};
  if (!previous.pages) {
    state[key] = result;
    return state;
  }
  // don't overwrite existing results
  if (previous.offset < result.offset) {
      state[key] = {
        ...result,
        results: [...previous.results, ...result.results]
      }
  }
  return state;
}

export default createReducer({
  // [queryCollections.START]: updateResultsLoading(true),
  // [queryCollections.ERROR]: updateResultsLoading(false),
  [queryCollections.COMPLETE]: updateResults,
  
  [fetchSearchResults.START]: (state, { query }) =>
    set([query.toKey()], { isFetching: true })(state),

  [fetchSearchResults.COMPLETE]: updateResults,

  // Upon error, leave some error status.
  [fetchSearchResults.ERROR]: (state, { args: { query } }) =>
    set([query.toKey()], { status: 'error' })(state),

  [fetchNextSearchResults.START]: (state, { query }) =>
    update([query.toKey()], set('isExpanding', true))(state),

  [fetchNextSearchResults.COMPLETE]: updateResults,

  // Upon error, merely reset the isExpanding flag.
  [fetchNextSearchResults.ERROR]: (state, { args: { query, result } }) =>
    update([query.toKey()], set('isExpanding', false))(state),

}, initialState);
