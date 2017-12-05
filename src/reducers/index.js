import { combineReducers } from 'redux'

import collections from './collections'
import searchResults from './search'
import metadata from './metadata'
import session from './session'
import entityCache from './entityCache';
import documentCache from './documentCache';
import documentChildrenResults from './documentChildrenResults';

const rootReducer = combineReducers({
  collections,
  searchResults,
  metadata,
  session,
  entityCache,
  documentCache,
  documentChildrenResults,
})

export default rootReducer;
