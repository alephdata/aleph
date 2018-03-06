import { combineReducers } from 'redux'

import metadata from './metadata';
import session from './session';
import statistics from './statistics';
import entities from './entities';
import entityReferences from './entityReferences';
import entityTags from './entityTags';
import documentRecords from './documentRecords';
import collections from './collections';
import collectionPermissions from './collectionPermissions';
import collectionXrefIndex from './collectionXrefIndex';
import collectionXrefMatches from './collectionXrefMatches';
import results from './results';
import alerts from './alerts';
import facets from './facets';

const rootReducer = combineReducers({
  metadata,
  session,
  statistics,
  entities,
  entityReferences,
  documentRecords,
  alerts,
  entityTags,
  collections,
  collectionPermissions,
  collectionXrefIndex,
  collectionXrefMatches,
  results,
  facets,
});

export default rootReducer;
