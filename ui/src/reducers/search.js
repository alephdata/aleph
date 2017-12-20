import { createReducer } from 'redux-act';
import uniqBy from 'lodash/uniqBy';
import { set } from 'lodash/fp';

import { fetchSearchResults, fetchNextSearchResults } from 'src/actions';

const initialState = {
  // Gets rid of a FOUC but technically not great
  isFetching: true,
  isFetchingNext: false,
  results: [],
};

export default createReducer({
  [fetchSearchResults.START]: state => ({
    // results: [],
    isFetching: true,
  }),

  [fetchSearchResults.COMPLETE]: (state, { result }) => ({
    ...state,
    ...result,
    isFetching: false
  }),

  [fetchNextSearchResults.START]: state =>
    set('isFetchingNext', true)(state),

  [fetchNextSearchResults.COMPLETE]: (state, { result }) => ({
    ...state,
    ...result,
    isFetchingNext: false,
    results: uniqBy([...state.results, ...result.results], 'id'),
  }),
}, initialState);
