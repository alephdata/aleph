
export function selectResult(state, query) {
  const queryState = state.search[query.toString()];
  return queryState && queryState.result;
}
