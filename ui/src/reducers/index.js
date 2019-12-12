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
import documentContent from './documentContent';
import collections from './collections';
import collectionDiagrams from './collectionDiagrams';
import collectionStatistics from './collectionStatistics';
import collectionStatus from './collectionStatus';
import collectionMappings from './collectionMappings';
import collectionPermissions from './collectionPermissions';
import collectionXrefIndex from './collectionXrefIndex';
import collectionXrefMatches from './collectionXrefMatches';
import results from './results';
import alerts from './alerts';
import diagrams from './diagrams';
import groups from './groups';
import roles from './roles';
import notifications from './notifications';
import systemStatus from './systemStatus';
import queryLogs from './queryLogs';


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
  documentContent,
  alerts,
  groups,
  roles,
  notifications,
  collections,
  collectionDiagrams,
  collectionStatistics,
  collectionStatus,
  collectionMappings,
  collectionPermissions,
  collectionXrefIndex,
  collectionXrefMatches,
  diagrams,
  queryLogs,
  results,
  systemStatus,
});

export default rootReducer;
