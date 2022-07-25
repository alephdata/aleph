import { createAction } from 'redux-act';

export const setConfigValue = createAction('SET_CONFIG_VALUE');

export const dispatchSetConfigValue = (value) => (dispatch) =>
  dispatch(setConfigValue(value));
