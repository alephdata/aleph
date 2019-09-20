import asyncActionCreator from './asyncActionCreator';
import { queryEndpoint } from './util';


export const queryDashboard = asyncActionCreator(query => async () => queryEndpoint(query), { name: 'QUERY_DASHBOARD' });
