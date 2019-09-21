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
    if (!query.state.q) {
      return state;
    }
    return {
      isLoading: true,
      shouldLoad: true,
      isError: false,
    };
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
