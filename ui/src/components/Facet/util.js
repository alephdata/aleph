const eSSuffix = '||/y';

export const formatDateQParam = (datetime) => {
  return `${new Date(datetime).getFullYear()}||/y`
};

export const cleanDateQParam = (value) => {
  return value.replace(eSSuffix, '');
};
