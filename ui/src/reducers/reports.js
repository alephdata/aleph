import { createReducer } from 'redux-act';

import { queryReports } from 'src/actions';
import { resultObjects } from 'src/reducers/util';

const initialState = {};

export default createReducer(
  {
    [queryReports.COMPLETE]: (state, { result }) => resultObjects(state, result),
  },
  initialState,
);
