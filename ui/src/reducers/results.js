import { createReducer } from 'redux-act';

import { updateResults, updateLoading, deleteCatche } from 'src/reducers/util';

import {
  queryCollections,
  queryEntities,
  queryDocumentRecords,
  queryNotifications,
  deleteCollection
} from 'src/actions';

const initialState = {};

export default createReducer({
  [queryCollections.START]: updateLoading(true),
  [queryCollections.ERROR]: updateLoading(false),
  [queryCollections.COMPLETE]: updateResults,
  [queryEntities.START]: updateLoading(true),
  [queryEntities.ERROR]: updateLoading(false),
  [queryEntities.COMPLETE]: updateResults,
  [queryDocumentRecords.START]: updateLoading(true),
  [queryDocumentRecords.ERROR]: updateLoading(false),
  [queryDocumentRecords.COMPLETE]: updateResults,
  [queryNotifications.START]: updateLoading(true),
  [queryNotifications.ERROR]: updateLoading(false),
  [queryNotifications.COMPLETE]: updateResults,
  [deleteCollection.COMPLETE]: deleteCatche
}, initialState);
