import { createReducer } from 'redux-act';

import { fetchDocumentReport } from 'src/actions';
import { objectLoadStart, objectLoadError, objectLoadComplete } from 'src/reducers/util';

const initialState = {};

export default createReducer({
  [fetchDocumentReport.START]:
    (state, { id }) => objectLoadStart(state, id),

  [fetchDocumentReport.ERROR]:
    (state, { error, args: { id } }) => objectLoadError(state, id, error),

  [fetchDocumentReport.COMPLETE]:
    (state, { id, data }) => objectLoadComplete(state, id, data),
}, initialState);
