import {setAuthHeader} from "../api";

export const login = (token) => dispatch => {
  setAuthHeader(`Bearer ${token}`);
  dispatch({type: 'LOGIN', token});
};

export const logout = () => dispatch => {
  setAuthHeader(null);
  dispatch({type: 'LOGOUT'});
};
