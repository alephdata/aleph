import { createReducer } from 'redux-act';
import { set, update } from 'lodash/fp';

import { fetchFacet, fetchNextFacetValues } from 'src/actions';
import { queryToFacetKey } from 'src/selectors';

const initialState = {
  // [field]: { [query key]: { total, values, isFetchingTotal, isFetchingValues, valuesLimit } } }
};

// Either or both the total and the values may be fetched. Set the appropriate
// flag(s), leaving the other unchanged.
const setFacetFetching = ({ fetchTotal, fetchValues }) => facet => {
  if (fetchTotal) {
    facet = { ...facet, isFetchingTotal: true };
  }
  if (fetchValues) {
    facet = { ...facet, isFetchingValues: true };
  }
  return facet;
}

const setFacetResult = ({ fetchTotal, fetchValues, result, valuesLimit }) => facet => {
  if (fetchTotal && result) {
    facet = { ...facet, total: result.total, isFetchingTotal: false };
  }
  if (fetchValues && result) {
    facet = { ...facet, values: result.values, isFetchingValues: false, valuesLimit };
  }
  return facet;
}

export default createReducer({
  [fetchFacet.START]: (state, { query, field, fetchTotal, fetchValues }) =>
    update([field, queryToFacetKey(query, field)],
      setFacetFetching({ fetchTotal, fetchValues })
    )(state),

  [fetchFacet.COMPLETE]: (state, { query, field, fetchTotal, fetchValues, result, valuesLimit }) =>
    update([field, queryToFacetKey(query, field)],
      setFacetResult({ fetchTotal, fetchValues, result, valuesLimit })
    )(state),

  [fetchFacet.ERROR]: (state, { args: { query, field, fetchTotal, fetchValues }}) =>
    update([field, queryToFacetKey(query, field)],
      setFacetResult({ fetchTotal, fetchValues, result: { total: undefined, values: undefined } })
    )(state),

  [fetchNextFacetValues.START]: (state, { query, field }) =>
    update([field, queryToFacetKey(query, field)],
      set('isExpandingValues', true)
    )(state),

  [fetchNextFacetValues.COMPLETE]: (state, { query, field, result, valuesLimit }) =>
    update([field, queryToFacetKey(query, field)],
      facet => ({ ...facet, isExpandingValues: false, values: result.values, valuesLimit })
    )(state),

  [fetchNextFacetValues.ERROR]: (state, { args: { query, field }}) =>
    update([field, queryToFacetKey(query, field)],
      set('isExpandingValues', false)
    )(state),
}, initialState);
