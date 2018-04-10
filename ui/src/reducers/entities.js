import { createReducer } from 'redux-act';
import { set, update } from 'lodash/fp';

import {
  queryEntities,
  fetchDocument,
  fetchEntity,
} from 'src/actions';
import { cacheResults } from './util';

const initialState = {};

export default createReducer({
    [fetchDocument.START]: (state, { id }) =>
      update(id, set('isFetching', true))(state),
    [fetchEntity.START]: (state, { id }) =>
      update(id, set('isFetching', true))(state),

    [fetchDocument.ERROR]: (state, { error, args: { id } }) =>
      set(id, { error: error.message, status: error.response !== undefined ? error.response.status : 400 })(state),
    [fetchEntity.ERROR]: (state, { error, args: { id } }) =>
      set(id, { error: error.message, status: error.response !== undefined ? error.response.status : 400 })(state),

    [fetchDocument.COMPLETE]: (state, { id, data }) =>
      set(id, data)(state),
    [fetchEntity.COMPLETE]: (state, { id, data }) =>
      set(id, data)(state),

    [queryEntities.COMPLETE]: cacheResults
}, initialState);
