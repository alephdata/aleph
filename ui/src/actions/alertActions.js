import { endpoint } from 'src/app/api';
import asyncActionCreator from './asyncActionCreator';


export const fetchAlerts = asyncActionCreator(() => async dispatch => {
  const response = await endpoint.get('alerts');
  response.data.results.reverse();
  return { alerts: response.data };
}, { name: 'FETCH_ALERTS' });

export const deleteAlert = asyncActionCreator((id) => async dispatch => {
  await endpoint.delete(`alerts/${id}`);
  return {};
}, { name: 'DELETE_ALERT' });

export const addAlert = asyncActionCreator((alert) => async dispatch => {
  await endpoint.post('alerts', alert);
  return {};
}, { name: 'ADD_ALERT' });
