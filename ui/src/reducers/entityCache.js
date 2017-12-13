import { createReducer } from 'redux-act';
import { set, update } from 'lodash/fp';

import { fetchEntity } from 'src/actions';

const initialState = {};

export default createReducer({
  [fetchEntity.START]: (state, { id }) =>
    update(id, set('_isFetching', true))(state),

  [fetchEntity.COMPLETE]: (state, { id, data }) =>
    set(id, data)(state),
}, initialState);
