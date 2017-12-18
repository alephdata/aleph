import { combineReducers } from 'redux'

import collections from './collections'
import searchResults from './search'
import metadata from './metadata'
import session from './session'
import apiCache from './apiCache';
import documentChildrenResults from './documentChildrenResults';

const rootReducer = combineReducers({
  collections,
  searchResults,
  metadata,
  session,
  apiCache,
  documentChildrenResults,
})

export default rootReducer;
