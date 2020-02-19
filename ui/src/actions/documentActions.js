import { endpoint } from 'src/app/api';
import asyncActionCreator from './asyncActionCreator';


export const fetchDocumentContent = asyncActionCreator(({ id }) => async () => {
  const response = await endpoint.get(`entities/${id}/content`);
  return { id, data: response.data };
}, { name: 'FETCH_DOCUMENT_CONTENT' });


export const ingestDocument = asyncActionCreator(
  (collectionId, metadata, file, onUploadProgress) => async () => {
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
        sync: true,
      },
    };
    const response = await endpoint.post(`collections/${collectionId}/ingest`, formData, config);
    return { ...response.data };
  }, { name: 'INGEST_DOCUMENT' },
);


export const fetchDocumentProcessingReport = asyncActionCreator(({ id }) => async () => {
  const response = await endpoint.get(`reports/document/${id}`);
  return { id, data: response.data };
}, { name: 'FETCH_DOCUMENT_PROCESSING_REPORT' });
