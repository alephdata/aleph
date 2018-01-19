import { combineReducers } from 'redux'

import collections from './collections'
import metadata from './metadata'
import session from './session'
import entities from './entities';
import entityReferences from './entityReferences';
import statistics from './statistics';
import role from './roles';

const rootReducer = combineReducers({
  collections,
  metadata,
  session,
  entities,
  entityReferences,
  statistics,
  role
});

export default rootReducer;
