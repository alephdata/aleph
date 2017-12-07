import {endpoint} from 'src/app/api';

export const fetchCollections = () => async dispatch => {
  const limit = 5000;

  async function fetchCollectionsPages(page=1) {
    const response = await endpoint.get('collections', {
      params: { limit, offset: (page - 1) * limit }
    });
    dispatch({
      type: 'FETCH_COLLECTIONS_SUCCESS',
      payload: { collections: response.data },
    });
    if (page < response.data.pages) {
      await fetchCollectionsPages(page + 1);
    }
  }

  await fetchCollectionsPages();
};

export const fetchSearchResults = filters => async dispatch => {
  dispatch({
    type: 'FETCH_SEARCH_REQUEST',
    payload: { filters },
  });
  const response = await endpoint.get('search', { params: filters });
  dispatch({
    type: 'FETCH_SEARCH_SUCCESS',
    payload: { filters, result: response.data },
  });
};

export const fetchNextSearchResults = () => async (dispatch, getState) => {
  const { searchResults } = getState();
  if (searchResults.next) {
    dispatch({
      type: 'FETCH_SEARCH_NEXT_REQUEST',
    });
    const response = await endpoint.get(searchResults.next);
    dispatch({
      type: 'FETCH_SEARCH_NEXT_SUCCESS',
      payload: { result: response.data },
    });
  }
};

export const fetchMetadata = () => async dispatch => {
  dispatch({
    type: 'FETCH_METADATA_REQUEST'
  });
  const response = await endpoint.get('metadata');
  dispatch({
    type: 'FETCH_METADATA_SUCCESS',
    payload: { metadata: response.data },
  });
};

export const fetchEntity = id => async dispatch => {
  dispatch({
    type: 'FETCH_ENTITY_REQUEST',
    payload: { id },
  });
  const response = await endpoint.get(`entities/${id}`);
  dispatch({
    type: 'FETCH_ENTITY_SUCCESS',
    payload: { id, data: response.data },
  });
};

export const fetchDocument = id => async dispatch => {
  dispatch({
    type: 'FETCH_DOCUMENT_REQUEST',
    payload: { id },
  });
  const response = await endpoint.get(`documents/${id}`);
  dispatch({
    type: 'FETCH_DOCUMENT_SUCCESS',
    payload: { id, data: response.data },
  });
};

export const fetchChildDocs = id => async dispatch => {
  dispatch({
    type: 'FETCH_CHILD_DOCS_REQUEST',
    payload: { id },
  });
  const response = await endpoint.get('documents', {
    params: { 'filter:parent.id': id }
  });
  dispatch({
    type: 'FETCH_CHILD_DOCS_SUCCESS',
    payload: { id, result: response.data },
  });
};

export const fetchChildDocsNext = (id, next) => async dispatch => {
  dispatch({
    type: 'FETCH_CHILD_DOCS_NEXT_REQUEST',
    payload: { id },
  });
  const response = await endpoint.get(next);
  dispatch({
    type: 'FETCH_CHILD_DOCS_NEXT_SUCCESS',
    payload: { id, result: response.data },
  });
};
