import { endpoint } from 'src/app/api';
import { Model } from '@alephdata/followthemoney';
import asyncActionCreator from './asyncActionCreator';

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
