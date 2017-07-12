const initialState = {
  isFetching: false,
  items: []
};

const documents = (state = initialState, action) => {
  switch (action.type) {
    case 'FETCH_DOCUMENTS_REQUEST':
      return { ...state, isFetching: true }
    case 'FETCH_DOCUMENTS_SUCCESS':
      return { ...state, isFetching: false, items: action.documents }
    default:
      return state;
  }
};

export default documents;
