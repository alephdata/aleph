import { createAction } from 'redux-act';
import asyncActionCreator from './asyncActionCreator';
import { endpoint } from 'app/api';

export const loginWithToken = createAction('LOGIN');

export const loginWithPassword = (email, password) => async (dispatch) => {
  const response = await endpoint.post('/sessions/login', { email, password });
  dispatch(loginWithToken(response.data.token));
};

export const logout = asyncActionCreator(
  () => async () => {
    await endpoint.post('/sessions/logout');
    return {};
  },
  { name: 'LOGOUT' },
);