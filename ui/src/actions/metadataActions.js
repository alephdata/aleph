import { endpoint } from '/src/app/api';
import asyncActionCreator from '/src/actions/asyncActionCreator.js';

export const fetchMetadata = asyncActionCreator(
  () => async () => {
    const response = await endpoint.get('metadata');
    return { metadata: response.data };
  },
  { name: 'FETCH_METADATA' }
);

export const fetchStatistics = asyncActionCreator(
  () => async () => {
    const response = await endpoint.get('statistics');
    return { statistics: response.data };
  },
  { name: 'FETCH_STATISTICS' }
);

export const fetchSystemStatus = asyncActionCreator(
  () => async () => {
    const response = await endpoint.get('status');
    return { status: response.data };
  },
  { name: 'FETCH_SYSTEM_STATUS' }
);
