import { endpoint } from 'src/app/api';
import asyncActionCreator from './asyncActionCreator';


export const fetchDocumentContent = asyncActionCreator(({ id }) => async dispatch => {
  const response = await endpoint.get(`entities/${id}/content`);
  return { id, data: response.data };
}, { name: 'FETCH_DOCUMENT_CONTENT' });


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
    },
    params: {
      sync: true
    }
  };
  const response = await endpoint.post(`collections/${collectionId}/ingest`, formData, config);
  return { documents: response.data.documents };
}, { name: 'INGEST_DOCUMENT' });


export const deleteDocument = asyncActionCreator(({document}) => async dispatch => {
    await endpoint.delete(`documents/${document.id}`, document);
  return {id: document.id};
}, { name: 'DELETE_DOCUMENT' });

