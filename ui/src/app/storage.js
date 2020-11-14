import { v4 as uuidv4 } from 'uuid';

import timestamp from 'util/timestamp';

export const loadState = () => {
  let state = {};
  try {
    const storedState = localStorage.getItem('state');
    state = storedState ? JSON.parse(storedState) : {};
  } catch (e) {
    // eslint-disable-next-line
    console.error('could not load state', e);
  }
  // we track unique visitors using a session ID. The ID is
  // stored in browser localStorage and rotated every couple
  // of months in order to comply with privacy regulations.
  const { session = {} } = state;
  const maxAge = timestamp() - (84600 * 30 * 6); // GDPR
  if (!session.sessionStart || session.sessionStart < maxAge) {
    session.sessionId = undefined;
  }
  if (!session.sessionId) {
    session.sessionId = uuidv4();
    session.sessionStart = timestamp();
  }
  return { ...state, session };
};

export const saveState = (state) => {
  try {
    // only save some state properties
    localStorage.setItem('state', JSON.stringify(state));
  } catch (e) {
    // eslint-disable-next-line
    console.error('could not persist state', e);
  }
};
