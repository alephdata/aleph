import keyBy from 'lodash/keyBy';
import { assign, assignWith } from 'lodash/fp';

export function mapById(result) {
  return result ? keyBy(result.results, 'id') : {};
}

export function cacheResults(state, { result }) {
  // The search results may contain only a subset of the object's fields, so
  // to not erase any existing value, we do a shallow merge of object fields.
  return assignWith(assign)(state, mapById(result));
}

export function updateLoading(value) {
  return function(state, { query, result }) {
    if (query !== undefined) {
      const key = query.toKey();
      assign(state[key], {isLoading: value});
    }
    return state;
  }
}

export function updateResults(state, { query, result }) {
  const key = query.toKey(),
        previous = state[key] || {};
  
  result = {
    ...result,
    isLoading: false,
    results: result.results.map((r) => r.id)
  }
  if (previous.page === undefined) {
    return { ...state, [key]: result};
  }
  // don't overwrite existing results
  if (previous.offset < result.offset) {
      state[key] = {
        ...result,
        results: [...previous.results, ...result.results]
      }
  }
  return state;
}
