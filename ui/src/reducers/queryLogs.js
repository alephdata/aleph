import { createReducer } from 'redux-act';
import { deleteQueryLog, fetchQueryLogs } from 'src/actions/queryLogsActions';
import { queryEntities } from 'src/actions/entityActions';
import { mergeResults } from './util';

const initialState = {
  isLoading: false,
  shouldLoad: true,
  isError: false,
  limit: 0,
  offset: 0,
};

const deriveQueryLog = (state, { query }) => {
  const queryText = query.state.q;
  const currentDate = new Date();
  let { results } = state;
  if (queryText && results) {
    const itemIndex = results.findIndex(({ text }) => queryText === text);
    results = [...results];
    let item = {
      count: 1,
      query: queryText,
      last: currentDate.toISOString(),
      first: currentDate.toISOString(),
    };
    if (itemIndex + 1) {
      [item] = results.splice(itemIndex, 1);
      item = {
        ...item,
        count: 1 + item.count,
      };
    }
    results.unshift(item);
    return {
      ...state,
      results,
    };
  } return state;
};

export default createReducer({
  [queryEntities.START]: deriveQueryLog,
  [fetchQueryLogs.START]: state => ({
    ...state,
    isLoading: true,
    shouldLoad: false,
    isError: false,
  }),
  [fetchQueryLogs.ERROR]: (state, { error }) => ({
    isLoading: false,
    shouldLoad: false,
    isError: true,
    results: [],
    error,
  }),
  [fetchQueryLogs.COMPLETE]: (state, {
    result: queryLogs,
  }) => mergeResults(state, queryLogs),
  [deleteQueryLog.START]: (state, props) => ({
    ...state,
    results: state.results.filter(({ query }) => query !== props.query),
  }),
}, initialState);
