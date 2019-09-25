import { Model } from '@alephdata/followthemoney';

import { endpoint } from 'src/app/api';
import asyncActionCreator from 'src/actions/asyncActionCreator';

export const fetchMetadata = asyncActionCreator(
  () => async () => {
    const response = await endpoint.get('metadata');
    const { model, ...metadata } = response.data;
    return {
      metadata: {
        ...metadata,
        model: new Model(model),
      },
    };
  },
  { name: 'FETCH_METADATA' },
);

export const fetchStatistics = asyncActionCreator(() => async () => {
  const response = await endpoint.get('statistics');
  return { statistics: response.data };
}, { name: 'FETCH_STATISTICS' });

export const fetchSystemStatus = asyncActionCreator(() => async () => {
  const response = await endpoint.get('status');
  return { status: response.data };
}, { name: 'FETCH_SYSTEM_STATUS' });
