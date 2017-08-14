import uniq from 'lodash/uniq';
import queryString from 'query-string';

import { endpoint } from '../api';

export const fetchCollections = (ids) => (dispatch, getState) => {
  const { collections } = getState();
  const newIds = uniq(ids).filter(id => !collections[id]);

  if (newIds.length > 0) {
    return endpoint.get('collections', {
        params: {'filter:id': newIds},
        paramsSerializer: queryString.stringify
      })
      .then(response => dispatch({
        type: 'FETCH_COLLECTIONS_SUCCESS',
        collections: response.data
      }));
  }
};

export const fetchSearchResults = (filters) => (dispatch) => {
  dispatch({
    type: 'FETCH_SEARCH_REQUEST',
    filters
  });

  return endpoint.get('search', {params: {...filters, facet: 'schema'}})
    .then(response => {
      const result = response.data;

      dispatch({
        type: 'FETCH_SEARCH_SUCCESS',
        filters,
        result
      });

      const collectionIds = result.results.map(result => result.collection_id);
      dispatch(fetchCollections(collectionIds));
    });
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
