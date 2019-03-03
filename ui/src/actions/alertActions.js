import { endpoint } from 'src/app/api';
import asyncActionCreator from './asyncActionCreator';
import { MAX_RESULTS } from './util';


export const fetchAlerts = asyncActionCreator(() => async () => {
  const params = { limit: MAX_RESULTS };
  const response = await endpoint.get('alerts', { params });
  return { alerts: response.data };
}, { name: 'FETCH_ALERTS' });

export const deleteAlert = asyncActionCreator(id => async () => {
  const response = await endpoint.delete(`alerts/${id}`);
  return response.data;
}, { name: 'DELETE_ALERT' });

export const addAlert = asyncActionCreator(alert => async () => {
  const response = await endpoint.post('alerts', alert);
  return response.data;
}, { name: 'ADD_ALERT' });
