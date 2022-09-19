import { endpoint } from 'app/api';
import asyncActionCreator from './asyncActionCreator';

export const ingestDocument = asyncActionCreator(
  (collectionId, metadata, file, onUploadProgress, cancelToken) => async () => {
    const formData = {
      meta: JSON.stringify(metadata),
      file: file,
    };

    const config = {
      onUploadProgress,
      params: { sync: true },
      cancelToken,
    };

    const response = await endpoint.postForm(
      `collections/${collectionId}/ingest`,
      formData,
      config
    );

    return { ...response.data };
  },
  { name: 'INGEST_DOCUMENT' }
);
