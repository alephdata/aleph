import { createReducer } from 'redux-act';
import { set, update } from 'lodash/fp';

import { fetchEntityTags } from 'src/actions';

const initialState = {};

export default createReducer({
    [fetchEntityTags.START]: (state, { id }) =>
      update(id, set('isLoading', true))(state),
    [fetchEntityTags.COMPLETE]: (state, { id, data }) =>
      set(id, data)(state),
}, initialState);
