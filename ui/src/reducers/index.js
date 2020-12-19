import { combineReducers } from 'redux';

import metadata from './metadata';
import mutation from './mutation';
import session from './session';
import config from './config';
import statistics from './statistics';
import entities from './entities';
import entityTags from './entityTags';
import values from './values';
import collections from './collections';
import collectionStatus from './collectionStatus';
import entityMappings from './entityMappings';
import collectionPermissions from './collectionPermissions';
import results from './results';
import alerts from './alerts';
import entitySets from './entitySets';
import entitySetItems from './entitySetItems';
import roles from './roles';
import notifications from './notifications';
import systemStatus from './systemStatus';
import exports from './exports';


const rootReducer = combineReducers({
  metadata,
  mutation,
  session,
  config,
  statistics,
  entities,
  entityTags,
  values,
  alerts,
  roles,
  notifications,
  collections,
  collectionStatus,
  collectionPermissions,
  entitySets,
  entitySetItems,
  entityMappings,
  results,
  systemStatus,
  exports,
});

export default rootReducer;
