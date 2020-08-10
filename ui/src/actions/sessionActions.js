import { createAction } from 'redux-act';
import { endpoint } from 'app/api';

export const loginWithToken = createAction('LOGIN');
export const logout = createAction('LOGOUT');

export const loginWithPassword = (email, password) => async (dispatch) => {
  const response = await endpoint.post('/sessions/login', { email, password });
  dispatch(loginWithToken(response.data.token));
};
