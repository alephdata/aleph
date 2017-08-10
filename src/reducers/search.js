const initialState = {
  isFetching: false,
  results: [],
  schemaFilter: 'All'
};

const searchResults = (state = initialState, action) => {
  switch (action.type) {
    case 'FETCH_SEARCH_REQUEST':
      return { ...state, isFetching: true }
    case 'FETCH_SEARCH_SUCCESS':
      return { ...state, ...action.result, isFetching: false }
    case 'FILTER_SEARCH_ENTITIES':
      return { ...state, schemaFilter: action.entityType }
    default:
      return state;
  }
};

export default searchResults;
