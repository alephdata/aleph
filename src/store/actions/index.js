import * as api from '../api';

export const fetchDocuments = (filters) => (dispatch) => {
  dispatch({
    type: 'FETCH_DOCUMENTS_REQUEST',
    filters
  });

  return api.getDocuments(filters)
    .then((response) => response.json())
    .then((json) => dispatch({
      type: 'FETCH_DOCUMENTS_SUCCESS',
      filters,
      documents: json.results
    }));
}