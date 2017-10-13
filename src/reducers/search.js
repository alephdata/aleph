const initialState = {
  // Gets rid of a FOUC but technically not great
  isFetching: true,
  results: []
};

const searchResults = (state = initialState, action) => {
  switch (action.type) {
    case 'FETCH_SEARCH_REQUEST':
      return { ...state, isFetching: true }
    case 'FETCH_SEARCH_SUCCESS':
      return { ...action.result, isFetching: false }
    default:
      return state;
  }
};

export default searchResults;
