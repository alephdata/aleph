import asyncActionCreator from "./asyncActionCreator";
import {queryEndpoint} from "./util";


export const fetchQueryLogs = asyncActionCreator(query => async () => {
  return queryEndpoint(query);
}, { name: 'FETCH_QUERY-LOGS' });