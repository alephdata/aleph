import { createReducer } from 'redux-act';
import { set, update, uniq } from 'lodash/fp';

import { fetchChildDocs, fetchNextChildDocs } from 'src/actions';
import { normaliseSearchResult } from './util';

const initialState = {};

export default createReducer({
  [fetchChildDocs.START]: (state, { id }) =>
    update(id, set('isFetching', true))(state),

  [fetchChildDocs.COMPLETE]: (state, { id, result }) =>
    set(id, normaliseSearchResult(result).result)(state),

  [fetchNextChildDocs.START]: (state, { id }) =>
    update(id, set('isFetchingNext', true))(state),

  [fetchNextChildDocs.COMPLETE]: (state, { id, result }) =>
    update(id, obj => ({
      ...mergeResults(obj, normaliseSearchResult(result).result),
      isFetchingNext: false,
    }))(state),
}, initialState);

function mergeResults(oldResult, newResult) {
  return {
    next: newResult.next,
    total: newResult.total,
    // uniq should not be necessary, but included just in case.
    results: uniq((oldResult ? oldResult.results : []).concat(newResult.results)),
  };
}
