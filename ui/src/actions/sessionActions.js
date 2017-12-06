import {endpoint} from 'src/app/api';

export const loginWithToken = token => dispatch => {
  dispatch({type: 'LOGIN', payload: { token } });
};

// TODO: Show success/error toasts
export const loginWithPassword = (email, password) => dispatch => {
  return endpoint.post('/sessions/login', {email, password}).then(response => {
    dispatch(loginWithToken(response.data.token));
  });
};

export const logout = () => dispatch => {
  dispatch({type: 'LOGOUT'});
};
