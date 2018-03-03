import { createReducer } from 'redux-act';
import { assign } from 'lodash/fp';

import {
  queryCollections,
  queryEntities,
  queryDocumentRecords,
} from 'src/actions';

const initialState = {};

function updateLoading(value) {
  return function(state, { query, result }) {
    const key = query.toKey();
    assign(state[key], {isLoading: value});
    return state;
  }
}

function updateResults(state, { query, result }) {
  const key = query.toKey(),
        previous = state[key] || {};
  
  result = {
    ...result,
    isLoading: false,
    results: result.results.map((r) => r.id)
  }
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
  [queryCollections.START]: updateLoading(true),
  [queryCollections.ERROR]: updateLoading(false),
  [queryCollections.COMPLETE]: updateResults,
  [queryEntities.START]: updateLoading(true),
  [queryEntities.ERROR]: updateLoading(false),
  [queryEntities.COMPLETE]: updateResults,
  [queryDocumentRecords.START]: updateLoading(true),
  [queryDocumentRecords.ERROR]: updateLoading(false),
  [queryDocumentRecords.COMPLETE]: updateResults,
}, initialState);
