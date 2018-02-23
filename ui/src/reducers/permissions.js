import { createReducer } from 'redux-act';
import { set, update } from 'lodash/fp';

import { fetchCollectionPermissions, updateCollectionPermissions } from 'src/actions';

const initialState = {};

export default createReducer({
  [fetchCollectionPermissions.COMPLETE]: (state, { permissions }) => ({
    ...permissions
  }),
  [updateCollectionPermissions.COMPLETE]: (state, { permissions }) => ({
    ...permissions
  }),
}, initialState);
