import { combineReducers } from 'redux'

import searchResults from './search'
import metadata from './metadata'
import session from './session'

const rootReducer = combineReducers({
  searchResults,
  metadata,
  session
})

export default rootReducer;
