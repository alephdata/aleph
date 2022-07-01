import asyncActionCreator from './asyncActionCreator';
import { queryEndpoint } from './util';

export const queryNotifications = asyncActionCreator(
  (query) => async () => queryEndpoint(query),
  { name: 'QUERY_NOTIFCATIONS' }
);
