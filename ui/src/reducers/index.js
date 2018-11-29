import { combineReducers } from 'redux'

import metadata from './metadata';
import session from './session';
import config from './config';
import statistics from './statistics';
import entities from './entities';
import entityReferences from './entityReferences';
import entityTags from './entityTags';
import documentRecords from './documentRecords';
import documentContent from './documentContent';
import collections from './collections';
import collectionPermissions from './collectionPermissions';
import collectionXrefIndex from './collectionXrefIndex';
import collectionXrefMatches from './collectionXrefMatches';
import results from './results';
import alerts from './alerts';
import notifications from './notifications';
import queryLogs from './queryLogs';

const rootReducer = combineReducers({
  metadata,
  session,
  config,
  statistics,
  entities,
  entityReferences,
  documentRecords,
  documentContent,
  alerts,
  notifications,
  entityTags,
  collections,
  collectionPermissions,
  collectionXrefIndex,
  collectionXrefMatches,
  queryLogs,
  results
});

export default rootReducer;
