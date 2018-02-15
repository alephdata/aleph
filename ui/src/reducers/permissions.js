import { createReducer } from 'redux-act';
import { set, update } from 'lodash/fp';

import { fetchCollectionPermissions } from 'src/actions';

const initialState = {};

export default createReducer({
  [fetchCollectionPermissions.COMPLETE]: (state, { permissions }) => ({
    ...permissions
  }),
}, initialState);
