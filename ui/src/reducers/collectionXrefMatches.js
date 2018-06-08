import { createReducer } from 'redux-act';

import { queryXrefMatches } from 'src/actions';
import { updateLoading } from 'src/reducers/util';

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
  [queryXrefMatches.START]: updateLoading(true),
  [queryXrefMatches.ERROR]: updateLoading(false),
  [queryXrefMatches.COMPLETE]: updateMatches,
}, initialState);
