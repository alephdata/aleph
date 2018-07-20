import keyBy from 'lodash/keyBy';
import { assign, assignWith } from 'lodash/fp';
import _ from 'lodash';

export function mapById(result) {
  return result ? keyBy(result.results, 'id') : {};
}

export function cacheResults(state, { result }) {
  // The search results may contain only a subset of the object's fields, so
  // to not erase any existing value, we do a shallow merge of object fields.
  result.isLoading = false;
  result.shouldLoad = false;
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
          shouldLoad: true,
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
          isError: false,
          shouldLoad: false
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
  
  result = { ...result, isLoading: false, shouldLoad: false, results };
  // don't overwrite existing results
  if (previous.page !== undefined && previous.offset < result.offset) {
    result = { ...result, results: [...previous.results, ...result.results] };
  }
  return { ...state, [key]: result};
}

export function flushResults(state, { query, result }) {
  for (let value of state) {
    value.shouldLoad = true;
  }
  return state;
}

export function objectLoadStart(state, id) {
  return _.merge(state, {
    id: {
      isLoading: true,
      shouldLoad: false
    }
  });
}

export function objectLoadError(state, id, error) {
  return _.merge(state, {
    id: {
      isLoading: false,
      isError: true,
      shouldLoad: true,
      error
    }
  });
}

export function objectLoadComplete(state, id, data) {
  return _.merge(state, {
    id: {
      isLoading: false,
      isError: false,
      shouldLoad: false,
      ...data
    }
  });
}

export function objectDelete(state, id) {
  _.unset(state, id);
  return state;
}

