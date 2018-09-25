import asyncActionCreator from "./asyncActionCreator";
import {endpoint} from "../app/api";


export const fetchQueryLogs = asyncActionCreator(() => async () => {
  const response = await endpoint.get('querylog');
  return { queryLogs: response.data };
}, { name: 'FETCH_QUERY-LOGS' });