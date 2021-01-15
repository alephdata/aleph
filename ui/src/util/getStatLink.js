import queryString from 'query-string';

import getCollectionLink from 'util/getCollectionLink';

export default function getStatLink(collection, field, value,) {
  if (collection) {
    const params = {
      [`csfilter:${field}`]: value,
    };
    const query = queryString.stringify(params);
    return `${getCollectionLink(collection)}?${query}#mode=search`;
  }

  const params = {
    [`filter:${field}`]: value,
  };
  const query = queryString.stringify(params);

  return `/search?${query}`;
}
