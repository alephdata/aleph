import { combineReducers } from 'redux'
import documents from './documents'
import metadata from './metadata'

const rootReducer = combineReducers({
  documents,
  metadata
})

export default rootReducer;
