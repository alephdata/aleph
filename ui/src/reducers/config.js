import { createReducer } from 'redux-act';
import { setLocale } from 'src/actions';

const initialState = {};

export default createReducer({
  [setLocale]: (state, { locale }) => ({ locale }),
}, initialState);
