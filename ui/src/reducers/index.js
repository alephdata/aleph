import { combineReducers } from 'redux';

import metadata from './metadata';
import session from './session';
import config from './config';
import statistics from './statistics';
import entities from './entities';
import entityReferences from './entityReferences';
import entityTags from './entityTags';
import values from './values';
import documentContent from './documentContent';
import collections from './collections';
import collectionStatus from './collectionStatus';
import collectionPermissions from './collectionPermissions';
import collectionXrefIndex from './collectionXrefIndex';
import collectionXrefMatches from './collectionXrefMatches';
import results from './results';
import alerts from './alerts';
import groups from './groups';
import notifications from './notifications';
import systemStatus from './systemStatus';
import queryLogs from './queryLogs';


const rootReducer = combineReducers({
  metadata,
  session,
  config,
  statistics,
  entities,
  entityReferences,
  entityTags,
  values,
  documentContent,
  alerts,
  groups,
  notifications,
  collections,
  collectionStatus,
  collectionPermissions,
  collectionXrefIndex,
  collectionXrefMatches,
  queryLogs,
  results,
  systemStatus,
});

export default rootReducer;
