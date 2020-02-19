import { createReducer } from 'redux-act';

import { queryProcessingTaskReports } from 'src/actions';
import { resultObjects } from 'src/reducers/util';

const initialState = {};

export default createReducer(
  {
    [queryProcessingTaskReports.COMPLETE]: (state, { result }) => resultObjects(state, result),
  },
  initialState,
);
