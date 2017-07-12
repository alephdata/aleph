const initialState = {
  isLoaded: false
};

const session = (state = initialState, action) => {
  switch (action.type) {
    case 'FETCH_SESSION_REQUEST':
      return { isLoaded: false }
    case 'FETCH_SESSION_SUCCESS':
      return { ...action.session, isLoaded: true }
    default:
      return state;
  }
};

export default session;
