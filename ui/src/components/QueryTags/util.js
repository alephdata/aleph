const eSSuffix = '||/y';

export const addESDateSuffix = (value) => {
  return value.replace(eSSuffix, '');
};

export const cleanDateQParam = (value) => {
  return value.replace(eSSuffix, '');
};
