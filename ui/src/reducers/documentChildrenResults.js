import uniq from 'lodash/uniq';

const initialState = {};

const documentChildrenResults = (state = initialState, action) => {
  const { type, payload } = action;
  switch (type) {
    case 'FETCH_CHILD_DOCS_REQUEST':
      return {
        ...state,
        [payload.id]: { ...state[payload.id], isFetching: true },
      };
    case 'FETCH_CHILD_DOCS_SUCCESS':
      return {
        ...state,
        [payload.id]: payload.data,
      };
    case 'FETCH_CHILD_DOCS_NEXT_REQUEST':
      return {
        ...state,
        [payload.id]: { ...state[payload.id], isFetchingNext: true },
      }
    case 'FETCH_CHILD_DOCS_NEXT_SUCCESS':
      return {
        ...state,
        [payload.id]: {
          ...mergeResults(state[payload.id] || {}, payload.data),
          isFetchingNext: false,
        },
      }
    default:
      return state;
  }
};

function mergeResults(oldResult, newResult) {
  return {
    next: newResult.next,
    total: newResult.total,
    // uniq should not be necessary, but included just in case.
    results: uniq((oldResult ? oldResult.results : []).concat(newResult.results)),
  };
}

export default documentChildrenResults;
