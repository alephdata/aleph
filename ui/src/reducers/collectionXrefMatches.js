import { createReducer } from 'redux-act';

import { queryXrefMatches, xrefMatches } from 'src/actions';
import { objectLoadStart, objectLoadError, objectLoadComplete, mergeResults } from 'src/reducers/util';

const initialState = {};

export function updateMatches(state, { query, result }) {
  const key = query.toKey();
  return objectLoadComplete(state, key, mergeResults(state[key], result));
}

export default createReducer({
  [queryXrefMatches.START]: (state, { query }) =>
    objectLoadStart(state, query.toKey()),

  [queryXrefMatches.ERROR]: (state, { error, args: { query } }) =>
    objectLoadError(state, query.toKey(), error),

  [queryXrefMatches.COMPLETE]: updateMatches,

  [xrefMatches.START]: state => ({
    ...state,
    isLoading: true,
    shouldLoad: false,
    isError: false
  }),

  [xrefMatches.COMPLETE]:  state => ({
    ...state,
    isLoading: false,
    shouldLoad: false,
    isError: false
  }),

  [xrefMatches.ERROR]:  state => ({
    ...state,
    isLoading: false,
    shouldLoad: false,
    isError: true
  })

}, initialState);
