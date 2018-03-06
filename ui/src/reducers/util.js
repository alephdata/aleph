import keyBy from 'lodash/keyBy';
import { assign, assignWith } from 'lodash/fp';

export function mapById(result) {
  return result ? keyBy(result.results, 'id') : {};
}

// prevResult is to be passed explicitly to appendResults, even though it should
// normally equal the current result; this is just for in case we e.g.
// accidentally trigger multiple fetches.
export function combineResults(prevResult, nextResult) {
  // We store the next result, but with the previous (= current) results
  // prepended. Note that result attributes like 'page' and 'limit' will be
  // confusing now, but we do not use them anyway.

  if (!prevResult) {
    return nextResult;
  }
  return {
    ...nextResult,
    results: [ ...prevResult.results, ...nextResult.results],
  }
}

export function cacheResults(state, { result }) {
  // The search results may contain only a subset of the object's fields, so
  // to not erase any existing value, we do a shallow merge of object fields.
  return assignWith(assign)(state, mapById(result));
}

