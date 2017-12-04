import {endpoint} from 'src/app/api';

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

export const fetchEntity = id => dispatch => {
  dispatch({
    type: 'FETCH_ENTITY_REQUEST',
    payload: { id },
  });

  return endpoint.get(`entities/${id}`)
    .then(response => {
      dispatch({
        type: 'FETCH_ENTITY_SUCCESS',
        payload: { id, data: response.data },
      });
    });
};

export const fetchDocument = id => dispatch => {
  dispatch({
    type: 'FETCH_DOCUMENT_REQUEST',
    payload: { id },
  });

  return endpoint.get(`documents/${id}`)
    .then(response => {
      dispatch({
        type: 'FETCH_DOCUMENT_SUCCESS',
        payload: { id, data: response.data },
      });
    });
};

export const searchDocuments = query => async dispatch => {
  dispatch({
    type: 'SEARCH_DOCUMENTS_REQUEST',
    payload: { query },
  });

  const response = await endpoint.get('documents', { params: query });
  dispatch({
    type: 'SEARCH_DOCUMENTS_SUCCESS',
    payload: { data: response.data },
  });
  return response.data;
};

export const fetchChildDocs = id => async dispatch => {
  dispatch({
    type: 'FETCH_CHILDDOCS_REQUEST',
    payload: id,
  });
  // Run a search for the documents. This will load the (stubs of the) documents
  // into the documentCache for us.
  let data = await dispatch(searchDocuments({ 'filter:parent.id': id }));
  if (data && data.results !== undefined) {
    // Since the docs are already put in the cache, we can normalise our data
    // structure by only storing the ids of the children in the document. For
    // simplicity, we pretend the API gave only these ids.
    data = { ...data, results: data.results.map(doc => doc.id) };
    dispatch({
      type: 'FETCH_CHILD_DOCS_SUCCESS',
      payload: { id, data },
    });
  }
};
