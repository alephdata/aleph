const initialState = {
  isLoaded: false
};

const metadata = (state = initialState, action) => {
  switch (action.type) {
    case 'FETCH_METADATA_REQUEST':
      return { ...action.metadata, isLoaded: false }
    case 'FETCH_METADATA_SUCCESS':
      return { ...action.metadata, isLoaded: true }
    default:
      return state;
  }
};

export default metadata;
