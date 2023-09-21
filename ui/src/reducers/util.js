import _ from 'lodash';

import timestamp from 'util/timestamp';

export function mergeResults(previous, current) {
  if (
    previous === undefined ||
    previous.results === undefined ||
    current.offset === 0
  ) {
    return current;
  }
  const expectedOffset = previous.limit + previous.offset;
  if (current.offset === expectedOffset) {
    return { ...current, results: [...previous.results, ...current.results] };
  }
  if (Number.isNaN(expectedOffset)) return current;
  return previous;
}

export function loadComplete(data) {
  return {
    ...data,
    isPending: false,
    isError: false,
    shouldLoad: false,
    loadedAt: timestamp(),
    selectorCache: undefined,
    error: undefined,
  };
}

export function objectLoadComplete(state, id, data = {}) {
  const oldData = state[id] || {};
  const newData = loadComplete(data);

  return { ...state, [id]: { ...oldData, ...newData } };
}

export function updateResultsKeyed(state, { query, result }) {
  if (!result?.results) {
    return updateResultsFull(state, { query, result });
  }
  const key = query.toKey();
  const res = { ...result, results: result.results.map((r) => r.id) };
  return objectLoadComplete(state, key, mergeResults(state[key], res));
}

export function updateResultsFull(state, { query, result }) {
  const key = query.toKey();
  return objectLoadComplete(state, key, mergeResults(state[key], result));
}

export function loadState(data) {
  const state = data || {};
  return {
    ...state,
    isPending: true,
    shouldLoad: true,
    shouldLoadDeep: true,
    isError: false,
  };
}

export function loadStart(state) {
  const prevState = state || {};
  return {
    ...prevState,
    isPending: true,
    shouldLoad: false,
    isError: false,
    loadedAt: undefined,
    error: undefined,
  };
}

export function objectLoadStart(state, id) {
  return { ...state, [id]: loadStart(state[id]) };
}

export function resultLoadStart(state, query) {
  return objectLoadStart(state, query.toKey());
}

export function loadError(state, error) {
  const prevState = state || {};
  return {
    ...prevState,
    isPending: false,
    shouldLoad: false,
    isError: true,
    loadedAt: undefined,
    error,
  };
}

export function objectLoadError(state, id, error) {
  return { ...state, [id]: loadError(state[id], error) };
}

export function resultLoadError(state, query, error) {
  return objectLoadError(state, query.toKey(), error);
}

export function objectReload(state, id) {
  const object = { isPending: true, shouldLoad: true };
  return { ...state, [id]: _.assign({}, state[id], object) };
}

export function objectDelete(state, id) {
  _.unset(state, id);
  return state;
}

export function resultObjects(state, result, onComplete = objectLoadComplete) {
  if (result.results !== undefined) {
    return result.results.reduce(
      (finalState, object) => onComplete(finalState, object.id, object),
      state
    );
  }
  return state;
}
