const initialState = {};

const documentCache = (state = initialState, action) => {
  if (!action.type.startsWith('FETCH_DOCUMENT_')) return state;
  const { id, data } = action.payload;
  switch (action.type) {
    case 'FETCH_DOCUMENT_REQUEST':
      return { ...state, [id]: { _isFetching: true } };
    case 'FETCH_DOCUMENT_SUCCESS':
      return { ...state, [id]: data };
    default:
      return state;
  }
};

export default documentCache;
