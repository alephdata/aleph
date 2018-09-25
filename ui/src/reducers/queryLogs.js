import { createReducer } from 'redux-act';

import {fetchQueryLogs} from "src/actions/queryLogsActions";
import {queryEntities} from "src/actions/entityActions";

const initialState = {
  results: new Map()
};

export default createReducer({
  [queryEntities.START]: (state, { query }) => {
    const queryText = query.state.q;
    const queryEntry = state.results.get(queryText);
    state.results.delete(queryText);
    return Object.assign({}, state, {
      results: Map.from(state.results.set(queryText, queryEntry ? {
        ...queryEntry,
        count: 1 + queryEntry.count
      } : { count : 1, text: queryText }))
    })
  },
  [fetchQueryLogs.START]: state => ({
    ...state,
    isLoading: true,
    shouldLoad: false,
    isError: false
  }),
  [fetchQueryLogs.ERROR]: (state, { error }) => ({
    isLoading: false,
    shouldLoad: false,
    isError: true,
    error
  }),
  [fetchQueryLogs.COMPLETE]: (state, { queryLogs }) => {
    const {results : metaResults } = queryLogs;
    const results = metaResults
      .reverse()
      .reduce((queryLogsObject, query) => queryLogsObject.set(query.text, query), new Map());
    return ({
      ...queryLogs,
      results
    })
  }
}, initialState);
