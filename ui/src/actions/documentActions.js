import { endpoint } from 'src/app/api';
import asyncActionCreator from './asyncActionCreator';
import { queryEndpoint } from './util';


export const fetchDocument = asyncActionCreator(({ id }) => async dispatch => {
  const response = await endpoint.get(`documents/${id}`);
  return { id, data: response.data };
}, { name: 'FETCH_DOCUMENT' });

export const queryDocumentRecords = asyncActionCreator((query) => async dispatch => {
  return queryEndpoint(query);
}, { name: 'QUERY_DOCUMENT_RECORDS' });

export const fetchDocumentPage = asyncActionCreator(({ documentId, page }) => async dispatch => {
  const response = await endpoint.get(`documents/${documentId}/records/${page}`);
  return { documentId, page, data: response.data };
}, { name: 'FETCH_DOCUMENT_PAGE' });

export const ingestDocument = asyncActionCreator((collectionId, metadata, file, onUploadProgress) => async dispatch => {
  const formData = new FormData();
  if (file) {
    formData.append('file', file);
  }
  formData.append('meta', JSON.stringify(metadata));
  const config = {
    onUploadProgress,
    headers: {
      'content-type': 'multipart/form-data',
    }
  };
  const response = await endpoint.post(`collections/${collectionId}/ingest`, formData, config);
  return { documents: response.data.documents };
}, { name: 'INGEST_DOCUMENT' });

export const deleteDocument = asyncActionCreator(({document}) => async dispatch => {
    await endpoint.delete(`documents/${document.id}`, document);
  return {id: document.id};
}, { name: 'DELETE_DOCUMENT' });

