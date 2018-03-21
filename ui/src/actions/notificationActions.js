import asyncActionCreator from './asyncActionCreator';
import { queryEndpoint } from './util';


export const queryNotifications = asyncActionCreator((query) => async dispatch => {
  return queryEndpoint(query);
}, { name: 'QUERY_NOTIFCATIONS' });
