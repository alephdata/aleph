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
import collectionPermissions from './collectionPermissions';
import entityMappings from './entityMappings';
import results from './results';
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
  roles,
  notifications,
  collections,
  collectionPermissions,
  entitySets,
  entitySetItems,
  entityMappings,
  results,
  systemStatus,
  exports,
});

export default rootReducer;
