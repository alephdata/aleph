// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
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
