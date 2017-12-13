import keyBy from 'lodash/keyBy';

import { fetchCollectionsPage } from 'src/actions';
import { normaliseSearchResult } from './util';

const initialState = {};

const collections = (state = initialState, action) => {
  const { type, payload } = action;
  switch (type) {
    case fetchCollectionsPage.COMPLETE:
      return {
        ...state,
        ...normaliseSearchResult(payload.result).objects,
      };
    default:
      return state;
  }
};

export default collections;
