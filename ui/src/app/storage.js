
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

  if(recentlyViewed && recentlyViewed.recentlyViewed) {
    return recentlyViewed.recentlyViewed;
  }

  return [];
}

export const setRecentlyViewedItem = (id) => {
  const recentlyViewed = parseRecentlyViewed();
  const thing = recentlyViewed.filter(item => item.id !== id);
  
  thing.push({
    id,
    date: Date.now(),
  });

  localStorage.setItem('recentlyViewed', JSON.stringify({
    recentlyViewed: thing,
  }));
}

export const getRecentlyViewedItem = (id) => {
  const recentlyViewed = parseRecentlyViewed();
  const item = recentlyViewed.filter(item => item.id === id)

  if (item && item.length) {
    return item[0];
  }
  
  return;
}

export const expireRecentlyViewed = () => {
  const recentlyViewed = parseRecentlyViewed();
  const expiry = 5259600000; //two months
  const expiryDate = Date.now() - expiry;

  localStorage.setItem('recentlyViewed', JSON.stringify({ 
    recentlyViewed: recentlyViewed.filter(item => new Date(parseInt(item.date, 10)) > expiryDate) 
  }));
}
