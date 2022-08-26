export const fetchExternalData = (dataURL: string) => {
  return new Promise((resolve, reject) => {
    fetch(dataURL)
      .then((response) => response.json())
      .then((json) => resolve(json))
      .catch((error) => reject(error));
  });
};

export const fetchLocalData = (id: string) => {
  const storedData = localStorage.getItem(id);
  return storedData && JSON.parse(storedData);
};
