import { createReducer } from 'redux-act';
import { set, update } from 'lodash/fp';

import { queryCollections } from 'src/actions';
import { queryToResultKey } from 'src/selectors';
import { combineResults } from './util';

const initialState = {};

export default createReducer({
  [queryCollections.START]: (state, { query }) =>
    update([queryToResultKey(query)], set('isLoading', true))(state),
  
  [queryCollections.ERROR]: (state, { args: { query, result } }) =>
    update([queryToResultKey(query)], set('isLoading', false))(state),

  [queryCollections.COMPLETE]: (state, { query, nextResult, prevResult }) => 
    set([queryToResultKey(query)], combineResults(prevResult, nextResult))(state),

}, initialState);
