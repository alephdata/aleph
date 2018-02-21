import { combineReducers } from 'redux'

import collections from './collections';
import metadata from './metadata';
import session from './session';
import entities from './entities';
import entityReferences from './entityReferences';
import entityTags from './entityTags';
import statistics from './statistics';
import role from './roles';
import alerts from './alerts';
import permissions from './permissions';
import users from './users';
import search from './search';
import facets from './facets';

const rootReducer = combineReducers({
  collections,
  metadata,
  session,
  entities,
  entityReferences,
  statistics,
  role,
  alerts,
  entityTags,
  permissions,
  users,
  search,
  facets,
});

export default rootReducer;
