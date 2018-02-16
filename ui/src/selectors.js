
export function selectResult(state, query) {
  return state.search[query.toString()];
}
