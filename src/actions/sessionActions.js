import {setAuthHeader} from "../api";

export const LOGIN = 'LOGIN';
export const LOGOUT = 'LOGOUT';

export const login = (token) => {
  setAuthHeader(`Bearer ${token}`);
  return {type: LOGIN, token};
};

export const logout = () => {
  setAuthHeader(null);
  return {type: LOGOUT};
};
