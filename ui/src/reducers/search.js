import { createReducer } from 'redux-act';
import { assign, set, update } from 'lodash/fp';

import {
  fetchSearchResults,
  fetchNextSearchResults,
  fetchFacet,
} from 'src/actions';
import { keyForQuery } from 'src/selectors';

// a mapping of query to its search result and facet results
const initialState = {
  // [queryString]: { result, facets: { [field]: { values, total } } }
};

// prevResult is to be passed explicitly to appendResults, even though it should
// normally equal the current result; this is just for in case we e.g.
// accidentally trigger multiple fetches.
function combineResults(state, { query, prevResult, nextResult }) {
  // We store the next result, but with the previous (= current) results
  // prepended. Note that result attributes like 'page' and 'limit' will be
  // confusing now, but we do not use them anyway.
  const totalResult = {
    ...nextResult,
    results: [ ...prevResult.results, ...nextResult.results],
  }

  return set([keyForQuery(query), 'result'], totalResult)(state);
}

// Either or both the total and the values may be fetched. Set the appropriate
// flag(s), leaving the other unchanged.
const setFacetFetching = ({ fetchTotal, fetchValues }) => facet => {
  if (fetchTotal) {
    facet = { ...facet, isFetchingTotal: true };
  }
  if (fetchValues) {
    facet = { ...facet, isFetchingValues: true };
  }
  return facet
}

const setFacetResult = ({ fetchTotal, fetchValues, result }) => facet => {
  if (fetchTotal) {
    facet = { ...facet, total: result.total, isFetchingTotal: false };
  }
  if (fetchValues) {
    facet = { ...facet, values: result.values, isFetchingValues: false };
  }
  return facet;
}

export default createReducer({
  [fetchSearchResults.START]: (state, { query }) =>
    set([keyForQuery(query), 'result'], { isFetching: true })(state),

  [fetchSearchResults.COMPLETE]: (state, { query, result }) =>
    set([keyForQuery(query), 'result'], result)(state),

  // Upon error, leave some error status.
  [fetchSearchResults.ERROR]: (state, { args: { query } }) =>
    set([keyForQuery(query), 'result'], { status: 'error' })(state),

  [fetchNextSearchResults.START]: (state, { query }) =>
    update([keyForQuery(query), 'result'], assign({ isExpanding: true }))(state),

  [fetchNextSearchResults.COMPLETE]: combineResults,

  // Upon error, merely reset the isExpanding flag.
  [fetchNextSearchResults.ERROR]: (state, { args: { query, result } }) =>
    update([keyForQuery(query), 'result'], assign({ isExpanding: false }))(state),

  [fetchFacet.START]: (state, { query, field, fetchTotal, fetchValues }) =>
    update([keyForQuery(query), 'facets', field],
      setFacetFetching({ fetchTotal, fetchValues })
    )(state),

  [fetchFacet.COMPLETE]: (state, { query, field, fetchTotal, fetchValues, result }) =>
    update([keyForQuery(query), 'facets', field],
      setFacetResult({ fetchTotal, fetchValues, result })
    )(state),

  [fetchFacet.ERROR]: (state, { args: { query, field, fetchTotal, fetchValues }}) =>
    update([keyForQuery(query), 'facets', field],
      setFacetResult({ fetchTotal, fetchValues, result: { total: undefined, values: undefined } })
    )(state),
}, initialState);
