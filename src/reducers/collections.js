import keyBy from 'lodash/keyBy';

const initialState = {
  results: []
};

const collections = (state = initialState, action) => {
  switch (action.type) {
    case 'FETCH_COLLECTIONS_SUCCESS':
      return {
        ...action.collections,
        results: {
          ...state.results,
          ...keyBy(action.collections.results, 'id')
        }
      };
    default:
      return state;
  }
};

export default collections;
