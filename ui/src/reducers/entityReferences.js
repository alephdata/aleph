import { createReducer } from 'redux-act';
import { set, update } from 'lodash/fp';

import { fetchEntityReferences } from 'src/actions';

const initialState = {};

export default createReducer({
  [fetchEntityReferences.START]: (state, { id }) =>
    update(id, set('isLoading', true))(state),

  [fetchEntityReferences.ERROR]: (state, { error, args: { id } }) =>
    set(id, { isLoading: false, isError: true, error: error })(state),

  [fetchEntityReferences.COMPLETE]: (state, { id, data }) =>
    set(id, data)(state),
}, initialState);
