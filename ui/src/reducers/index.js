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
import documentProcessingReport from './documentProcessingReport';
import collections from './collections';
import collectionStatistics from './collectionStatistics';
import collectionStatus from './collectionStatus';
import collectionProcessingReport from './collectionProcessingReport';
import entityMappings from './entityMappings';
import collectionPermissions from './collectionPermissions';
import collectionXref from './collectionXref';
import results from './results';
import alerts from './alerts';
import diagrams from './diagrams';
import groups from './groups';
import processingTaskReports from './processingTaskReports';
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
  documentProcessingReport,
  alerts,
  groups,
  roles,
  notifications,
  collections,
  collectionStatistics,
  collectionStatus,
  collectionProcessingReport,
  collectionPermissions,
  collectionXref,
  diagrams,
  entityMappings,
  queryLogs,
  results,
  processingTaskReports,
  systemStatus,
});

export default rootReducer;
