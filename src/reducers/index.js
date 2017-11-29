import { combineReducers } from 'redux'

import collections from './collections'
import searchResults from './search'
import metadata from './metadata'
import session from './session'
import entityCache from './entityCache';

const rootReducer = combineReducers({
  collections,
  searchResults,
  metadata,
  session,
  entityCache,
})

export default rootReducer;
