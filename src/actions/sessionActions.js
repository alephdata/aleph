export const login = (token) => dispatch => {
  dispatch({type: 'LOGIN', token});
};

export const logout = () => dispatch => {
  dispatch({type: 'LOGOUT'});
};
