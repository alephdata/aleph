import { combineReducers } from 'redux';

import messages from './messages';
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
import bookmarks from './bookmarks';
import localBookmarks from './localBookmarks';

const rootReducer = combineReducers({
  messages,
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
  bookmarks,

  // TODO: Remove after deadline
  // See https://github.com/alephdata/aleph/issues/2864
  localBookmarks,
});

export default rootReducer;
