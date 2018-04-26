import { createReducer } from 'redux-act';
import { set, update } from 'lodash/fp';

import { fetchCollectionPermissions, updateCollectionPermissions } from 'src/actions';

const initialState = {};

export default createReducer({
  [fetchCollectionPermissions.START]: (state, { id }) =>
    update(id, set('isLoading', true))(state),

  [fetchCollectionPermissions.ERROR]: (state, { error, args: { id } }) =>
    set(id, { isLoading: false, isError: true, error: error })(state),

  [fetchCollectionPermissions.COMPLETE]: (state, { id, data }) =>
    set(id, data.results)(state),

  [updateCollectionPermissions.COMPLETE]: (state, { id, data }) =>
    set(id, data.results)(state),

}, initialState);
