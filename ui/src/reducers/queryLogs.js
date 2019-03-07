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

export default createReducer({
  [queryEntities.START]: (state, { query }) => {
    const queryText = query.state.q;
    let { results } = state;
    if (queryText && results) {
      const itemIndex = results.findIndex(({ text }) => queryText === text);
      results = [...results];
      let item = {
        count: 1,
        text: queryText,
        created_at: Reflect.construct(Date, []).toISOString(),
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
  },
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
    results: new Map(),
    error,
  }),
  [fetchQueryLogs.COMPLETE]: (state, {
    result: queryLogs,
  }) => mergeResults(state, queryLogs),
  [deleteQueryLog.START]: (state, { text: query }) => ({
    ...state,
    results: state.results.filter(({ text }) => text !== query),
  }),
}, initialState);
