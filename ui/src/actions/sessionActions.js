import { createAction } from 'redux-act';
import asyncActionCreator from '/src/actions/asyncActionCreator.js';
import { endpoint } from '/src/app/api.js';

export const loginWithToken = createAction('LOGIN');

export const loginWithPassword = (email, password) => async (dispatch) => {
  const response = await endpoint.post('/sessions/login', { email, password });
  dispatch(loginWithToken(response.data.token));
};

export const logout = asyncActionCreator(
  () => async () => {
    const response = await endpoint.post('/sessions/logout');
    return { redirect: response.data.redirect };
  },
  { name: 'LOGOUT' }
);
