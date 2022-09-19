import { endpoint } from 'app/api';
import asyncActionCreator from './asyncActionCreator';
import { queryEndpoint } from './util';

export const queryAlerts = asyncActionCreator(
  (query) => async () => queryEndpoint(query),
  { name: 'QUERY_ALERTS' }
);

export const deleteAlert = asyncActionCreator(
  (id) => async () => {
    const response = await endpoint.delete(`alerts/${id}`);
    return response.data;
  },
  { name: 'DELETE_ALERT' }
);

export const createAlert = asyncActionCreator(
  (alert) => async () => {
    const response = await endpoint.post('alerts', alert);
    return response.data;
  },
  { name: 'ADD_ALERT' }
);
