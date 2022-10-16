import { createReducer } from 'redux-act';
import { fetchMessages, dismissMessage } from 'actions';
import { loadState, loadStart, loadError, loadComplete } from 'reducers/util';

// The IDs of dismissed messages are persisted in local storage. Storing only
// the ID of the most recently dismissed message is not enough, as there could
// be multiple messages active at the same time and users wouldn’t be able to
// dismiss both. However, storing all the IDs a user has ever dismissed isn't
// necessary as well.
const DISMISSED_MESSAGES_LIMIT = 5;

const initialState = loadState({
  messages: [],
  dismissed: [],
});

export default createReducer(
  {
    [fetchMessages.START]: (state) => loadStart(state),
    [fetchMessages.ERROR]: (state, { error }) => loadError(state, error),
    [fetchMessages.COMPLETE]: (state, messages) =>
      loadComplete({ ...state, ...messages }),
    [dismissMessage]: (state, message) => {
      if (state.dismissed.includes(message.id)) {
        return state;
      }

      const dismissed = [
        message.id,
        ...state.dismissed.slice(0, DISMISSED_MESSAGES_LIMIT - 1),
      ];

      return { ...state, dismissed };
    },
  },
  initialState
);
