
export const loadState = () => {
  try {
    const state = localStorage.getItem('state');
    return state ? JSON.parse(state) : undefined;
  } catch (e) {
    // eslint-disable-next-line
    console.error('could not load state', e);
    return undefined;
  }
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
