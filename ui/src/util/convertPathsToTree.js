const convertPathsToTree = (files) => {
  const retVal = {};

  files.forEach((file) => {
    const path = file.path || file.webkitRelativePath || file.name;

    // remove leading slash if present, then split into path segments and reduce to object
    path
      .replace(/^\/+/g, '')
      .split('/')
      .reduce((r, e, i, sourceArray) => {
        if (i === sourceArray.length - 1) {
          r[e] = file;
          return r[e];
        }
        r[e] = r[e] ? r[e] : {};
        return r[e];
      }, retVal);
  });

  return retVal;
};

export default convertPathsToTree;
