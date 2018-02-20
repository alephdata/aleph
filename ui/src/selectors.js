
export function selectResult(state, query) {
  const queryState = state.search[keyForQuery(query)];
  return queryState && queryState.result;
}

// Not really a selector; but needed both here and in the search reducer.
export function keyForQuery(query) {
  return query
    .clear('limit')
    .clear('offset')
    .toString()
}
