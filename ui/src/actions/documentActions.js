import { endpoint } from 'src/app/api';
import asyncActionCreator from './asyncActionCreator';
import { queryEndpoint } from './util';


export const fetchDocument = asyncActionCreator(({ id }) => async dispatch => {
  const response = await endpoint.get(`documents/${id}`);
  return { id, data: response.data };
}, { name: 'FETCH_DOCUMENT' });

export const queryDocumentRecords = asyncActionCreator((query) => async dispatch => {
  return queryEndpoint(query);
}, { name: 'QUERY_DOCUMENT_RECORDS' });
