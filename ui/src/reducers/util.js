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
  return function(state, { query, result, error, args }) {
    if (error !== undefined) {
      const key = args.query.toKey();
      return {
        ...state,
        [key]: {
          isLoading: false,
          isError: true,
          error
        }
      };
    }
    if (query !== undefined) {
      const key = query.toKey();
      const result = state[key] || {};
      return {
        ...state,
        [key]: {
          ...result,
          isLoading: value,
          isError: false
        }
      };
    }
    return state;
  }
}

export function updateResults(state, { query, result }) {
  const key = query.toKey(),
        previous = state[key] && state[key].total !== undefined ? state[key] : {},
        results = result.results.map((r) => r.id);
  
  result = { ...result, isLoading: false, results };
  // don't overwrite existing results
  if (previous.page !== undefined && previous.offset < result.offset) {
    result = { ...result, results: [...previous.results, ...result.results] };
  }
  return { ...state, [key]: result};
}

export function flushResults() {
  console.log('HI HI')
  return {}
}
