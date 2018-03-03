import { endpoint } from 'src/app/api';
import asyncActionCreator from './asyncActionCreator';


export const fetchDocument = asyncActionCreator(({ id }) => async dispatch => {
  const response = await endpoint.get(`documents/${id}`);
  return { id, data: response.data };
}, { name: 'FETCH_DOCUMENT' });

export const fetchDocumentRecords = asyncActionCreator(({ id }) => async dispatch => {
  const response = await endpoint.get(`/documents/${id}/records`);
  return { data: response.data };
}, { name: 'FETCH_DOCUMENT_RECORDS' });

export const fetchNextDocumentRecords = asyncActionCreator(({ next }) => async dispatch => {
  const response = await endpoint.get(next);
  return { data: response.data };
}, { name: 'FETCH_NEXT_DOCUMENT_RECORDS' });
