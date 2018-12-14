import { createAction } from 'redux-act';
import { endpoint } from 'src/app/api';

export const loginWithToken = createAction('LOGIN');
export const logout = createAction('LOGOUT');

export const loginWithPassword = (email, password) => async dispatch => {
  const response = await endpoint.post('/sessions/login', {email, password}, {isAuthRequest: true});
  dispatch(loginWithToken(response.data.token));
};
