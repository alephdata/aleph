
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

const parseRecentlyViewed = () => {
  const recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewed'));

  return recentlyViewed || {};
}

export const setRecentlyViewedItem = (id) => {
  const recentlyViewed = parseRecentlyViewed();
  recentlyViewed[id] = Date.now();
  localStorage.setItem('recentlyViewed', JSON.stringify(recentlyViewed));
}

export const getRecentlyViewedItem = (id) => {
  const recentlyViewed = parseRecentlyViewed();
  const item = recentlyViewed[id];

  return item;
}

export const expireRecentlyViewed = () => {
  const recentlyViewed = parseRecentlyViewed();
  const expiry = 5259600000; // Two months
  const expiryDate = Date.now() - expiry;

  // Not wanting to prematurely optamise here but If 
  // walking the entire list becomes an issue in the future
  // look to first sorting the list of recentlyViewed items 
  // by date using recentlyViewed.entries() and then .sort()
  // you can then remove everying that is expired and stop before
  // iterating the entire list of entries.
  for(const item in recentlyViewed) {
    const itemDate = new Date(parseInt(recentlyViewed[item], 10));

    if(itemDate < expiryDate) {
      delete recentlyViewed[item];
    }
  }
  
  localStorage.setItem('recentlyViewed', JSON.stringify(recentlyViewed));
}

export const setSearchConfig = (searchConfig) => {
  localStorage.setItem('searchConfig', JSON.stringify(searchConfig));
}

export const getSearchConfig = () => {
  return JSON.parse(localStorage.getItem('searchConfig'));
}
