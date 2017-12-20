import { combineReducers } from 'redux'

import collections from './collections'
import searchResults from './search'
import metadata from './metadata'
import session from './session'
import entities from './entities';
import documentChildrenResults from './documentChildrenResults';

const rootReducer = combineReducers({
  collections,
  searchResults,
  metadata,
  session,
  entities,
  documentChildrenResults,
})

export default rootReducer;
