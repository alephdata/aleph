import uniqBy from 'lodash/uniqBy';

const initialState = {
  // Gets rid of a FOUC but technically not great
  isFetching: true,
  isFetchingNext: false,
  results: []
};

const searchResults = (state = initialState, action) => {
  const { type, payload } = action;
  switch (type) {
    case 'FETCH_SEARCH_REQUEST':
      return { ...state, isFetching: true }
    case 'FETCH_SEARCH_SUCCESS':
      return { ...state, ...payload.result, isFetching: false }
    case 'FETCH_SEARCH_NEXT_REQUEST':
      return { ...state, isFetchingNext: true }
    case 'FETCH_SEARCH_NEXT_SUCCESS':
      return { ...state, ...payload.result, isFetchingNext: false,
        results: uniqBy([...state.results, ...payload.result.results], 'id')};
    default:
      return state;
  }
};

export default searchResults;
