import { createReducer } from 'redux-act';

import { queryXrefMatches } from 'src/actions';
import { objectLoadStart, objectLoadError } from 'src/reducers/util';

const initialState = {};

export function updateMatches(state, { query, result }) {
  const key = query.toKey(),
        previous = state[key] || {};

  if (previous.page === undefined) {
    return { ...state, [key]: result };
  }
  // append to existing results
  return {
    ...state,
    [key]: {
      ...result,
      results: [...previous.results, ...result.results]
    }
  };
}


export default createReducer({
  [queryXrefMatches.START]: (state, { query }) =>
    objectLoadStart(state, query.toKey()),

  [queryXrefMatches.ERROR]: (state, { error, args: { query } }) =>
    objectLoadError(state, query.toKey(), error),

  [queryXrefMatches.COMPLETE]: updateMatches,

}, initialState);
