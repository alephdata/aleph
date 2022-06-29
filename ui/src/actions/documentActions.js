// SPDX-FileCopyrightText: 2014 2014 Emma Prest, <emma@occrp.org> et al.
//
// SPDX-License-Identifier: MIT

import { endpoint } from 'app/api';
import asyncActionCreator from './asyncActionCreator';


export const ingestDocument = asyncActionCreator(
  (collectionId, metadata, file, onUploadProgress, cancelToken) => async () => {
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
      params: { sync: true },
      cancelToken
    };
    const response = await endpoint.post(`collections/${collectionId}/ingest`, formData, config);
    return { ...response.data };
  }, { name: 'INGEST_DOCUMENT' },
);
