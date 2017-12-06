import keyBy from 'lodash/keyBy';

const initialState = {
  results: {},
};

const collections = (state = initialState, action) => {
  const { type, payload } = action;
  switch (type) {
    case 'FETCH_COLLECTIONS_SUCCESS':
      return {
        ...payload.collections,
        results: {
          ...state.results,
          ...keyBy(payload.collections.results, 'id')
        }
      };
    default:
      return state;
  }
};

export default collections;
