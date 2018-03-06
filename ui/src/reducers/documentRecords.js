import { createReducer } from 'redux-act';

import {
  queryDocumentRecords,
} from 'src/actions';
import { cacheResults } from './util';

const initialState = {};

export default createReducer({
    [queryDocumentRecords.COMPLETE]: cacheResults
}, initialState);
