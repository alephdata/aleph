import {LOGIN, LOGOUT} from "../actions/sessionActions";
import jwt_decode from "jwt-decode";

const initialState = {
  loggedIn: false
};

const login = (token) => {
  const data = jwt_decode(token);
  return {
    ...data,
    token,
    loggedIn: true
  };
};

const session = (state = initialState, action) => {
  switch (action.type) {
    case LOGIN:
      return login(action.token);
    case LOGOUT:
      return {loggedIn: false};
    default:
      return state;
  }
};

export default session;
