import { createReducer } from 'redux-act';
import { set, update } from 'lodash/fp';

import {
  queryDocumentRecords,
  fetchDocumentPage,
  uploadDocument
} from 'src/actions';
import { cacheResults } from './util';

const initialState = {};

export function documentRecordKey(documentId, page) {
  return `${documentId}/records/${page}`;
}

export default createReducer({
  [fetchDocumentPage.START]: (state, { documentId, page }) =>
    update(documentRecordKey(documentId, page), set('isLoading', true))(state),

  [fetchDocumentPage.ERROR]: (state, { error, args: { documentId, page } }) =>
    set(documentRecordKey(documentId, page), { isLoading: false, isError: true, error: error })(state),

  [fetchDocumentPage.COMPLETE]: (state, { documentId, page, data }) =>
    set(documentRecordKey(documentId, page), data)(state),

  [queryDocumentRecords.COMPLETE]: cacheResults,

  [uploadDocument.START]: (state, { documentId, file }) =>
    update(documentId, set('isLoading', true))(state)

}, initialState);
