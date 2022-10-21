import { createReducer } from 'redux-act';

import { createBookmark, deleteBookmark } from 'actions';

const initialState = {
  entities: [],
};

export default createReducer(
  {
    [createBookmark.COMPLETE]: (state, entityId) => {
      if (state.entities.includes(entityId)) {
        return state;
      }

      return {
        ...state,
        entities: [...state.entities, entityId],
      };
    },

    [deleteBookmark.COMPLETE]: (state, entityId) => {
      if (!state.entities.includes(entityId)) {
        return state;
      }

      return {
        ...state,
        entities: state.entities.filter((id) => id !== entityId),
      };
    },
  },
  initialState
);
