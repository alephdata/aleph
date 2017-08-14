import { endpoint } from '../api';

export const fetchSearchResults = (filters) => (dispatch) => {
  dispatch({
    type: 'FETCH_SEARCH_REQUEST',
    filters
  });

  return endpoint.get('search', {params: {...filters, facet: 'schema'}})
    .then((response) => response.data)
    .then((data) => dispatch({
      type: 'FETCH_SEARCH_SUCCESS',
      filters,
      result: data
    }));
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
}

export const fetchSession = () => (dispatch) => {
  dispatch({
    type: 'FETCH_SESSION_REQUEST'
  });

  return endpoint.get('sessions')
    .then((response) => dispatch({
      type: 'FETCH_SESSION_SUCCESS',
      session: response.data
    }));
}
