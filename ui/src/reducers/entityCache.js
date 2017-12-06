const initialState = {};

const entityCache = (state = initialState, action) => {
  const { type, payload } = action;
  if (!type.startsWith('FETCH_ENTITY_')) return state;
  const { id, data } = payload;
  switch (type) {
    case 'FETCH_ENTITY_REQUEST':
      return { ...state, [id]: { _isFetching: true } };
    case 'FETCH_ENTITY_SUCCESS':
      return { ...state, [id]: data };
    default:
      return state;
  }
};

export default entityCache;
