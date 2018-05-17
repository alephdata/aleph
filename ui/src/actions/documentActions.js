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

export const uploadDocument = asyncActionCreator((collectionId, file, onUploadProgress) => async dispatch => {
  const formData = new FormData();
  formData.append('file', file);
  //formData.append('meta', ' ');
  const config = {
    onUploadProgress,
    headers: {
      'content-type': 'multipart/form-data',
    }
  };

  const response = await endpoint.post(`collections/${collectionId}/ingest`, formData, config);
  console.log('res', response)
  return { file: response.data};
}, { name: 'UPLOAD_DOCUMENT' });

