import { endpoint } from 'src/app/api';
import asyncActionCreator from './asyncActionCreator';
import { queryEndpoint } from './util';


export const queryNotifications = asyncActionCreator(query => async () => queryEndpoint(query), { name: 'QUERY_NOTIFCATIONS' });

export const deleteNotifications = asyncActionCreator(() => async () => {
  await endpoint.delete('notifications');
  return { };
}, { name: 'DELETE_NOTIFICATIONS' });
