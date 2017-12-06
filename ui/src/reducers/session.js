import jwt_decode from 'jwt-decode';

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
  const { type, payload } = action;
  switch (type) {
    case 'LOGIN':
      return login(payload.token);
    case 'LOGOUT':
      return {loggedIn: false};
    default:
      return state;
  }
};

export default session;
