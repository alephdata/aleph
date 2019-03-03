import { endpoint } from 'src/app/api';
import asyncActionCreator from './asyncActionCreator';
import { queryEndpoint } from './util';


export const fetchQueryLogs = asyncActionCreator(query => async () => queryEndpoint(query), { name: 'FETCH_QUERY-LOGS' });

export const deleteQueryLog = asyncActionCreator(queryLog => async () => endpoint.delete('/querylog', {
  params: { query: queryLog.text },
}), { name: 'DELETE_QUERY-LOG' });
