import { createReducer } from 'redux-act';

import { fetchDocumentContent } from 'src/actions';
import { objectLoadStart, objectLoadError, objectLoadComplete } from 'src/reducers/util';

const initialState = {};

export default createReducer({
  [fetchDocumentContent.START]: (state, { id }) => objectLoadStart(state, id),
  [fetchDocumentContent.ERROR]: (state, { error, args: { id }, }) => objectLoadError(state, id, error),
  [fetchDocumentContent.COMPLETE]: (state, { id, data }) => objectLoadComplete(state, id, data),
}, initialState);
