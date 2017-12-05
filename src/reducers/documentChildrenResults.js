const initialState = {};

const documentChildrenResults = (state = initialState, action) => {
  const { type, payload } = action;
  switch (type) {
    case 'FETCH_CHILD_DOCS_SUCCESS':
      return {
        ...state,
        [payload.id]: mergeResults((state[payload.id] || {}).childDocIdsResult, payload.data),
      };
    default:
      return state;
  }
};

function mergeResults(oldResult, newResult) {
  return {
    next: newResult.next,
    total: newResult.total,
    results: (oldResult ? oldResult.results : []).concat(newResult.results),
  }
}

export default documentChildrenResults;
