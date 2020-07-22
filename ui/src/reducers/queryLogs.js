import { createReducer } from 'redux-act';
import { deleteQueryLog, fetchQueryLogs } from 'actions';
import { queryEntities } from 'actions/entityActions';
import { mergeResults } from './util';

const initialState = {
  isPending: true,
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
      isPending: true,
      shouldLoad: true,
      isError: false,
      result: state.result,
    };
  },

  [fetchQueryLogs.START]: state => ({
    ...state,
    isPending: true,
    shouldLoad: false,
    isError: false,
  }),

  [fetchQueryLogs.ERROR]: (state, { error }) => ({
    isPending: false,
    shouldLoad: false,
    isError: true,
    result: state.result,
    error,
  }),

  [fetchQueryLogs.COMPLETE]: (state, {
    result: queryLogs,
  }) => mergeResults(state, queryLogs),

  [deleteQueryLog.COMPLETE]: state => ({
    isPending: true,
    shouldLoad: true,
    isError: false,
    result: state.result,
  }),

}, initialState);
