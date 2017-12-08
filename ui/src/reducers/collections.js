import keyBy from 'lodash/keyBy';

import { fetchCollectionsPage } from 'src/actions';

const initialState = {
  results: {},
};

const collections = (state = initialState, action) => {
  const { type, payload } = action;
  switch (type) {
    case fetchCollectionsPage.COMPLETE:
      return {
        ...payload.result,
        results: {
          ...state.results,
          ...keyBy(payload.result.results, 'id')
        }
      };
    default:
      return state;
  }
};

export default collections;
