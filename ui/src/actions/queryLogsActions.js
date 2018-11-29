import asyncActionCreator from "./asyncActionCreator";
import {queryEndpoint} from "./util";
import {endpoint} from "src/app/api";


export const fetchQueryLogs = asyncActionCreator(query => async () => {
  return queryEndpoint(query);
}, { name: 'FETCH_QUERY-LOGS' });

export const deleteQueryLog = asyncActionCreator((queryLog) => async () => {
  return endpoint.delete(`/querylog`,{
    params: {query:queryLog.text}
  });
}, { name: 'DELETE_QUERY-LOG' });
