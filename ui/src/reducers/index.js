import { combineReducers } from 'redux'

import metadata from './metadata';
import session from './session';
import statistics from './statistics';
import entities from './entities';
import entityReferences from './entityReferences';
import entityTags from './entityTags';
import collections from './collections';
import collectionPermissions from './collectionPermissions';
import collectionXrefIndex from './collectionXrefIndex';
import collectionXrefMatches from './collectionXrefMatches';
import role from './roles';
import alerts from './alerts';
import search from './search';
import facets from './facets';

const rootReducer = combineReducers({
  metadata,
  session,
  entities,
  entityReferences,
  statistics,
  role,
  alerts,
  entityTags,
  collections,
  collectionPermissions,
  collectionXrefIndex,
  collectionXrefMatches,
  search,
  facets,
});

export default rootReducer;
