import { combineReducers } from 'redux'

import collections from './collections'
import metadata from './metadata'
import session from './session'
import entities from './entities';
import statistics from './statistics';

const rootReducer = combineReducers({
  collections,
  metadata,
  session,
  entities,
  statistics
});

export default rootReducer;
