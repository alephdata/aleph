import { createAction } from 'redux-act';

export const setConfigValue = createAction('SET_CONFIG_VALUE');
export const dismissHint = createAction('DISMISS_HINT', (id) => ({ id }));

export const dispatchSetConfigValue = (value) => (dispatch) =>
  dispatch(setConfigValue(value));
