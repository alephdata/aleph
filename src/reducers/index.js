import { combineReducers } from 'redux'

import collections from './collections'
import searchResults from './search'
import metadata from './metadata'
import session from './session'

const rootReducer = combineReducers({
  collections,
  searchResults,
  metadata,
  session
})

export default rootReducer;
