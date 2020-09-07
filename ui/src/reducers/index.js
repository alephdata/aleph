import { combineReducers } from 'redux';

import metadata from './metadata';
import mutation from './mutation';
import session from './session';
import config from './config';
import statistics from './statistics';
import entities from './entities';
import entityReferences from './entityReferences';
import entityTags from './entityTags';
import values from './values';
import collections from './collections';
import collectionStatus from './collectionStatus';
import entityMappings from './entityMappings';
import collectionPermissions from './collectionPermissions';
import collectionXref from './collectionXref';
import results from './results';
import alerts from './alerts';
import entitySets from './entitySets';
import roles from './roles';
import notifications from './notifications';
import systemStatus from './systemStatus';
import queryLogs from './queryLogs';
import exports from './exports';


const rootReducer = combineReducers({
  metadata,
  mutation,
  session,
  config,
  statistics,
  entities,
  entityReferences,
  entityTags,
  values,
  alerts,
  roles,
  notifications,
  collections,
  collectionStatus,
  collectionPermissions,
  collectionXref,
  entitySets,
  entityMappings,
  queryLogs,
  results,
  systemStatus,
  exports,
});

export default rootReducer;
