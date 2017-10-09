import keyBy from 'lodash/keyBy';

const initialState = {};

const collections = (state = initialState, action) => {
  switch (action.type) {
    case 'FETCH_COLLECTIONS_SUCCESS':
      return { ...state, ...keyBy(action.collections.results, 'id') };
    default:
      return state;
  }
};

export default collections;
