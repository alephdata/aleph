import { createReducer } from 'redux-act';
import { setConfigValue, dismissHint, setLocale } from '/src/actions/index.js';

const initialState = {};

export default createReducer(
  {
    [setConfigValue]: (state, newVal) => {
      return { ...state, ...newVal };
    },
    [setLocale]: (state, { locale }) => ({ locale }),
    [dismissHint]: (state, { id }) => {
      const current = state.dismissedHints || [];

      return {
        ...state,
        dismissedHints: [...current, id],
      };
    },
  },
  initialState
);
