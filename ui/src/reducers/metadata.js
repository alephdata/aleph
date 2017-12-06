const initialState = {
  isLoaded: false
};

const metadata = (state = initialState, action) => {
  const { type, payload } = action;
  switch (type) {
    case 'FETCH_METADATA_REQUEST':
      return { isLoaded: false };
    case 'FETCH_METADATA_SUCCESS':
      return { ...payload.metadata, isLoaded: true };
    default:
      return state;
  }
};

export default metadata;
