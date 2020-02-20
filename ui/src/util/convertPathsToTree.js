const convertPathsToTree = files => {
  const retVal = {};

  files.forEach(file => {
    const path = file.path || file.webkitRelativePath;
    path.split('/')
      // filter out empty string path segments (i.e. leading / )
      .filter(segment => segment && segment !== '')
      .reduce((r, e, i, sourceArray) => {
        console.log(r, e);
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
//
// export const traverseFileTree = (tree, baseFunc, recursiveFunc) => {
//   return Object.entries(tree).map(([key, value]) => {
//     if (value instanceof File) {
//       return baseFunc(value);
//     } else {
//       return recursiveFunc(key);
//
//       traverseFileTree(value, baseFunc, recursiveFunc);
//     }
//   }
// }
