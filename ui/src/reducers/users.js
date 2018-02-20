import { createReducer } from 'redux-act';

import { fetchUsers } from 'src/actions';

const initialState = {};

export default createReducer({
  [fetchUsers.COMPLETE]: (state, { users }) => ({
    ...users
  }),
}, initialState);
