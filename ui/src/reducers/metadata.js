import { fetchMetadata } from 'src/actions';

const initialState = {
  isLoaded: false
};

const metadata = (state = initialState, action) => {
  const { type, payload } = action;
  switch (type) {
    case fetchMetadata.START:
      return { isLoaded: false };
    case fetchMetadata.COMPLETE:
      return { ...payload.metadata, isLoaded: true };
    default:
      return state;
  }
};

export default metadata;
