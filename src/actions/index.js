import {endpoint} from '../api';

export const fetchCollections = () => (dispatch) => {
  const limit = 5000;

  function fetchCollectionsPages(page=1) {
    return endpoint.get('collections', {
        params: { limit, offset: (page - 1) * limit }
      })
      .then(response => {
        dispatch({
          type: 'FETCH_COLLECTIONS_SUCCESS',
          collections: response.data
        });

        if (page < response.data.pages) {
          fetchCollectionsPages(page + 1);
        }
      });
  }

  fetchCollectionsPages();
};

export const fetchSearchResults = (filters) => (dispatch) => {
  dispatch({
    type: 'FETCH_SEARCH_REQUEST',
    filters
  });

  return endpoint.get('search', { params: filters })
    .then(response => {
      const result = response.data;

      dispatch({
        type: 'FETCH_SEARCH_SUCCESS',
        filters,
        result
      });
    });
};

export const fetchNextSearchResults = () => (dispatch, getState) => {
  const { searchResults } = getState();

  if (searchResults.next) {
    dispatch({
      type: 'FETCH_SEARCH_NEXT_REQUEST',
    });

    return endpoint.get(searchResults.next)
      .then(response => {
        dispatch({
          type: 'FETCH_SEARCH_NEXT_SUCCESS',
          result: response.data
        });
      });
  }
};

export const fetchMetadata = () => (dispatch) => {
  dispatch({
    type: 'FETCH_METADATA_REQUEST'
  });

  return endpoint.get('metadata')
    .then((response) => dispatch({
      type: 'FETCH_METADATA_SUCCESS',
      metadata: response.data
    }));
};
