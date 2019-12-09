import _ from 'lodash';


export function mergeResults(previous, current) {
  if (previous === undefined || previous.results === undefined) {
    return current;
  }
  const expectedOffset = (previous.limit + previous.offset);
  if (current.offset === expectedOffset) {
    return { ...current, results: [...previous.results, ...current.results] };
  }
  if (Number.isNaN(expectedOffset)) return current;
  return previous;
}

export function loadComplete(data) {
  return { ...data, isLoading: false, isError: false, shouldLoad: false };
}

export function objectLoadComplete(state, id, data = {}) {
  return { ...state, [id]: loadComplete(data) };
}

export function updateResults(state, { query, result }) {
  const key = query.toKey();
  const res = { ...result, results: result.results.map(r => r.id) };
  return objectLoadComplete(state, key, mergeResults(state[key], res));
}

export function invalidateResults() {
  return {};
}

export function loadState(data) {
  const state = data || {};
  return { ...state, isLoading: false, shouldLoad: true, isError: true };
}

export function loadStart(state) {
  const prevState = state || {};
  return { ...prevState, isLoading: true, shouldLoad: false, isError: false };
}

export function objectLoadStart(state, id) {
  return { ...state, [id]: loadStart(state[id]) };
}

export function resultLoadStart(state, query) {
  return objectLoadStart(state, query.toKey());
}

export function loadError(state, error) {
  const prevState = state || {};
  return { ...prevState, isLoading: false, shouldLoad: false, isError: false, error };
}

export function objectLoadError(state, id, error) {
  return { ...state, [id]: loadError(state[id], error) };
}

export function resultLoadError(state, query, error) {
  return objectLoadError(state, query.toKey(), error);
}

export function objectReload(state, id) {
  const object = { isLoading: false, shouldLoad: true };
  return { ...state, [id]: _.assign({}, state[id], object) };
}

export function objectDelete(state, id) {
  _.unset(state, id);
  return state;
}

export function resultObjects(state, result, onComplete = objectLoadComplete) {
  if (result.results !== undefined) {
    return result.results
      .reduce((finalState, object) => onComplete(finalState, object.id, object), state);
  }
  return state;
}
