import { combineReducers } from 'redux'

import collections from './collections'
import metadata from './metadata'
import session from './session'
import entities from './entities';
import entityReferences from './entityReferences';
import entityTags from './entityTags';
import statistics from './statistics';

const rootReducer = combineReducers({
  collections,
  metadata,
  session,
  entities,
  entityReferences,
  entityTags,
  statistics
});

export default rootReducer;
