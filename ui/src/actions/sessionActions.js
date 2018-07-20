import { createAction } from 'redux-act';
import { endpoint } from 'src/app/api';

export const loginWithToken = createAction('LOGIN');
export const logout = createAction('LOGOUT');

// TODO: Show success/error toasts
export const loginWithPassword = (email, password) => async dispatch => {
  const response = await endpoint.post('/sessions/login', {email, password});
  dispatch(loginWithToken(response.data.token));
};
