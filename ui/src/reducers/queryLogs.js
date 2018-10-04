import { createReducer } from 'redux-act';

import {fetchQueryLogs} from "src/actions/queryLogsActions";
import {queryEntities} from "src/actions/entityActions";
import {mergeResults} from "./util";

const initialState = {
  isLoading: false,
  shouldLoad: true,
  isError: false,
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
      } : { count : 1, text: queryText, created_at:Reflect.construct(Date, []).toISOString() }))
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
    results :new Map(),
    error
  }),
  [fetchQueryLogs.COMPLETE]: (state, { query, result: queryLogs }) => {
    const {results : metaResults } = queryLogs;
    let results = metaResults
      // .reverse()
      .reduce((queryLogsObject, query) => queryLogsObject.set(query.text, query), new Map());

    const newState = mergeResults({
      ...state,
        results: [...state.results].reverse()
    }, {...queryLogs, results});
    console.log(newState);
    return {
      ...newState,
    results: new Map([...newState.results].reverse())
    }
  }
}, initialState);
