import uniqBy from 'lodash/uniqBy';

import { fetchSearchResults, fetchNextSearchResults } from 'src/actions';

const initialState = {
  // Gets rid of a FOUC but technically not great
  isFetching: true,
  isFetchingNext: false,
  results: [],
};

const searchResults = (state = initialState, action) => {
  const { type, payload } = action;
  switch (type) {
    case fetchSearchResults.START:
      return { results: [], isFetching: true };
    case fetchSearchResults.COMPLETE:
      return { ...state, ...payload.result, isFetching: false };
    case fetchNextSearchResults.START:
      return { ...state, isFetchingNext: true };
    case fetchNextSearchResults.COMPLETE:
      return { ...state, ...payload.result, isFetchingNext: false,
        results: uniqBy([...state.results, ...payload.result.results], 'id')};
    default:
      return state;
  }
};

export default searchResults;
