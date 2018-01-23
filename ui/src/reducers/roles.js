import { createReducer } from 'redux-act';

import { fetchRole, addRole } from 'src/actions';

const initialState = {
    isLoaded: false,
};

export default createReducer({
    [fetchRole.START]: state => ({ isLoaded: false }),
    [addRole.START]: state => ({ isLoaded: false }),

    [fetchRole.COMPLETE]: (state, { role }) => ({
        ...role,
        isLoaded: true
    }),
    [addRole.COMPLETE]: (state, { role }) => ({
        ...role,
        isLoaded: true
    }),
}, initialState);
