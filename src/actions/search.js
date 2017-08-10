import { endpoint } from '../api';

export const fetchSearchResults = (filters) => (dispatch) => {
  dispatch({
    type: 'FETCH_SEARCH_REQUEST',
    filters
  });

  return endpoint.get('search', {params: filters})
    .then((response) => response.data)
    .then((data) => dispatch({
      type: 'FETCH_SEARCH_SUCCESS',
      filters,
      result: data
    }));
};

export const filterSearchEntities = (entityType) => (dispatch) => {
  console.log(entityType);

  dispatch({
    type: 'FILTER_SEARCH_ENTITIES',
    entityType
  });
};
