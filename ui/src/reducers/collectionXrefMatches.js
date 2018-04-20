import { createReducer } from 'redux-act';
import { set, update } from 'lodash/fp';

import { fetchCollectionXrefMatches, fetchNextCollectionXrefMatches } from 'src/actions';
import { matchesKey } from 'src/selectors';
import { combineResults } from 'src/reducers/util';

const initialState = {};

export default createReducer({
  [fetchCollectionXrefMatches.COMPLETE]: (state, { id, otherId, result }) =>
    set(matchesKey(id, otherId), result)(state),

  [fetchNextCollectionXrefMatches.START]: (state, { id, otherId }) =>
    update(matchesKey(id, otherId), set('isLoading', true))(state),
  
  [fetchNextCollectionXrefMatches.ERROR]: (state, { id, otherId }) =>
    update(matchesKey(id, otherId), set('isLoading', false))(state),
  
  [fetchNextCollectionXrefMatches.COMPLETE]: (state, { id, otherId, prevResult, nextResult }) =>
    set(matchesKey(id, otherId), combineResults(prevResult, nextResult))(state),

}, initialState);
