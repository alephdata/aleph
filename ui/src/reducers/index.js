import { combineReducers } from 'redux'

import collections from './collections'
import metadata from './metadata'
import session from './session'
import entities from './entities';

const rootReducer = combineReducers({
  collections,
  metadata,
  session,
  entities,
})

export default rootReducer;
