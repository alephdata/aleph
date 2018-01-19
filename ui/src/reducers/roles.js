import { createReducer } from 'redux-act';

import { fetchRole } from 'src/actions';

const initialState = {
    isLoaded: false,
};

export default createReducer({
    [fetchRole.START]: state => ({ isLoaded: false }),

    [fetchRole.COMPLETE]: (state, { role }) => ({
        ...role,
        isLoaded: true
    }),
}, initialState);
