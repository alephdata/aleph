import { createReducer } from 'redux-act';
import { set } from 'lodash/fp';

import {
  fetchSearchResults,
  fetchNextSearchResults
} from 'src/actions';


const initialState = {};

function storeResults(state, { result, query }) {
  return set([query.toString()], result)(state);
}

function appendResults(state, { result }) {
  return state;
}

export default createReducer({
  [fetchSearchResults.START]: (state, { query }) =>
    set([query.toString()], { isFetching: true })(state),
  [fetchSearchResults.COMPLETE]: storeResults,
  [fetchNextSearchResults.COMPLETE]: appendResults,
}, initialState);
