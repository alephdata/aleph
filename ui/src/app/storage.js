
export const loadState = () => {
  try {
    const storedState = localStorage.getItem('state');
    return storedState ? JSON.parse(storedState) : {};
  } catch (e) {
    // eslint-disable-next-line
    console.error('could not load state', e);
    return {}
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
