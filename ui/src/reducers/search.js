import { createReducer } from 'redux-act';
import { set, update } from 'lodash/fp';

import {
  fetchSearchResults,
  fetchNextSearchResults,
} from 'src/actions';
import { queryToResultKey } from 'src/selectors';
import { combineResults } from 'src/reducers/util';

// a mapping of query string to result object
const initialState = {};


export default createReducer({
  [fetchSearchResults.START]: (state, { query }) =>
    set([queryToResultKey(query)], { isFetching: true })(state),

  [fetchSearchResults.COMPLETE]: (state, { query, result }) =>
    set([queryToResultKey(query)], result)(state),

  // Upon error, leave some error status.
  [fetchSearchResults.ERROR]: (state, { args: { query } }) =>
    set([queryToResultKey(query)], { status: 'error' })(state),

  [fetchNextSearchResults.START]: (state, { query }) =>
    update([queryToResultKey(query)], set('isExpanding', true))(state),

  [fetchNextSearchResults.COMPLETE]: (state, { query, prevResult, nextResult }) =>
    set([queryToResultKey(query)], combineResults(prevResult, nextResult))(state),

  // Upon error, merely reset the isExpanding flag.
  [fetchNextSearchResults.ERROR]: (state, { args: { query, result } }) =>
    update([queryToResultKey(query)], set('isExpanding', false))(state),
}, initialState);
