import { createReducer } from 'redux-act';

import { fetchDocumentProcessingReport } from 'src/actions';
import { objectLoadStart, objectLoadError, objectLoadComplete } from 'src/reducers/util';

const initialState = {};

export default createReducer({
  [fetchDocumentProcessingReport.START]:
    (state, { id }) => objectLoadStart(state, id),

  [fetchDocumentProcessingReport.ERROR]:
    (state, { error, args: { id } }) => objectLoadError(state, id, error),

  [fetchDocumentProcessingReport.COMPLETE]:
    (state, { id, data }) => objectLoadComplete(state, id, data),
}, initialState);
