import { endpoint } from '../api';

export const fetchDocuments = (filters) => (dispatch) => {
  dispatch({
    type: 'FETCH_DOCUMENTS_REQUEST',
    filters
  });

  return endpoint.get('search', {params: filters})
    .then((response) => response.data)
    .then((data) => dispatch({
      type: 'FETCH_DOCUMENTS_SUCCESS',
      filters,
      documents: data.results
    }));
}

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
