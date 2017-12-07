import { fetchEntity } from 'src/actions';

const initialState = {};

const entityCache = (state = initialState, action) => {
  const { type, payload } = action;
  switch (type) {
    case fetchEntity.START: {
      const { id } = payload;
      return { ...state, [id]: { _isFetching: true } };
    }
    case fetchEntity.COMPLETE: {
      const { id, data } = payload;
      return { ...state, [id]: data };
    }
    default:
      return state;
  }
};

export default entityCache;
