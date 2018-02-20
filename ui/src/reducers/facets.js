import { createReducer } from 'redux-act';
import { update } from 'lodash/fp';

import {
  fetchFacet,
} from 'src/actions';
import { queryToFacetKey } from 'src/selectors';

const initialState = {
  // [field]: { [query key]: { total, values, isFetchingTotal, isFetchingValues } } }
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
  [fetchFacet.START]: (state, { query, field, fetchTotal, fetchValues }) =>
    update([field, queryToFacetKey(query, field)],
      setFacetFetching({ fetchTotal, fetchValues })
    )(state),

  [fetchFacet.COMPLETE]: (state, { query, field, fetchTotal, fetchValues, result }) =>
    update([field, queryToFacetKey(query, field)],
      setFacetResult({ fetchTotal, fetchValues, result })
    )(state),

  [fetchFacet.ERROR]: (state, { args: { query, field, fetchTotal, fetchValues }}) =>
    update([field, queryToFacetKey(query, field)],
      setFacetResult({ fetchTotal, fetchValues, result: { total: undefined, values: undefined } })
    )(state),
}, initialState);
