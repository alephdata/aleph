import { endpoint } from 'app/api';
import asyncActionCreator from 'actions/asyncActionCreator';

export const fetchMetadata = asyncActionCreator(
  () => async () => {
    try {
      const response = await endpoint.get('metadata');
      return { metadata: response.data };
    } catch (e) {
      throw e;
    }
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
