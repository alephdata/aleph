import queryString from 'query-string';
import getCollectionLink from 'util/getCollectionLink';
import collectionViewIds from 'components/Collection/collectionViewIds';

export default function getStatLink(collection, field, value,) {
  if (collection) {
    const params = {
      [`csfilter:${field}`]: value,
    };
    const query = queryString.stringify(params);
    return `${getCollectionLink(collection, { mode: collectionViewIds.SEARCH })}?${query}`;
  }

  const params = {
    [`filter:${field}`]: value,
  };
  const query = queryString.stringify(params);

  return `/search?${query}`;
}
