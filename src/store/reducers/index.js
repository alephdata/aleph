import { combineReducers } from 'redux'
import documents from './documents'
import metadata from './metadata'
import session from './session'

const rootReducer = combineReducers({
  documents,
  metadata,
  session
})

export default rootReducer;
