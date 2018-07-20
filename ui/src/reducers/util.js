import _ from 'lodash';


export function mergeResults(previous, current) {
  if (previous === undefined || previous.limit === undefined) {
    return current;
  }
  if (current.offset === (previous.limit + previous.offset)) {
    return { ...current, results: [...previous.results, ...current.results] };
  }
  return current;
}


export function updateResults(state, { query, result }) {
  const key = query.toKey();
  const res = { ...result, results: result.results.map((r) => r.id) };
  return objectLoadComplete(state, key, mergeResults(state[key], res));
}


export function invalidateResults(state) {
  for (let value of state) {
    value.shouldLoad = true;
  }
  return state;
}

export function objectLoadStart(state, id) {
  return _.merge(state, {
    [id]: { isLoading: true, shouldLoad: false }
  });
}


export function resultLoadStart(state, query) {
  return objectLoadStart(state, query.toKey());
}


export function objectLoadError(state, id, error) {
  return _.merge(state, {
    [id]: {
      isLoading: false,
      isError: true,
      shouldLoad: true,
      error
    }
  });
}


export function resultLoadError(state, query, error) {
  return objectLoadError(state, query.toKey(), error);
}


export function objectLoadComplete(state, id, data) {
  return _.merge(state, {
    [id]: {
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


export function resultObjects(state, result) {
  if (result.results !== undefined) {
    for (let object of result.results) {
      objectLoadComplete(state, object.id, object);
    }  
  }
  return state;
}
