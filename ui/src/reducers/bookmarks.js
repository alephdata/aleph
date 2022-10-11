import { createReducer } from 'redux-act';

import timestamp from 'util/timestamp';
import { createBookmark, deleteBookmark } from 'actions';

const initialState = [];

export default createReducer(
  {
    [createBookmark.COMPLETE]: (state, entity) => {
      if (state.find(({ id }) => id === entity.id)) {
        return state;
      }

      return [
        ...state,
        {
          id: entity.id,
          bookmarkedAt: timestamp(),
          caption: entity.getCaption(),
          collection: {
            id: entity.collection.id,
            label: entity.collection.label,
            category: entity.collection.category,
          },
        },
      ];
    },

    [deleteBookmark.COMPLETE]: (state, entity) => {
      return state.filter(({ id }) => id !== entity.id);
    },
  },
  initialState
);
