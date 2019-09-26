import { createReducer } from 'redux-act';
import { deleteQueryLog, fetchQueryLogs } from 'src/actions';
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
  [queryEntities.COMPLETE]: (state, { query }) => {
    if (!query.state.q) {
      return state;
    }
    return {
      isLoading: false,
      shouldLoad: true,
      isError: false,
      result: state.result,
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
    result: state.result,
    error,
  }),

  [fetchQueryLogs.COMPLETE]: (state, {
    result: queryLogs,
  }) => mergeResults(state, queryLogs),

  [deleteQueryLog.COMPLETE]: state => ({
    isLoading: false,
    shouldLoad: true,
    isError: false,
    result: state.result,
  }),

}, initialState);
