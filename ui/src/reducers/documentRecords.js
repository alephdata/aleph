import { createReducer } from 'redux-act';

import {
  queryDocumentRecords,
  fetchDocumentPage
} from 'src/actions';
import { objectLoadStart, objectLoadError, objectLoadComplete, resultObjects } from 'src/reducers/util';

const initialState = {};

export function documentRecordKey(documentId, page) {
  return `${documentId}/records/${page}`;
}

export default createReducer({
  [fetchDocumentPage.START]: (state, { documentId, page }) =>
    objectLoadStart(state, documentRecordKey(documentId, page)),

  [fetchDocumentPage.ERROR]: (state, { error, args: { documentId, page } }) =>
    objectLoadError(state, documentRecordKey(documentId, page), error),

  [fetchDocumentPage.COMPLETE]: (state, { documentId, page, data }) =>
    objectLoadComplete(state, documentRecordKey(documentId, page), data),

  [queryDocumentRecords.COMPLETE]: (state, { result }) => 
    resultObjects(state, result),
}, initialState);
