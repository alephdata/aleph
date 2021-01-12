import queryString from 'query-string';
import getCollectionLink from 'util/getCollectionLink';
import collectionViewIds from 'components/Collection/collectionViewIds';

export default function getStatLink(collection, field, value,) {
  if (collection) {
    const params = {
      [`csfilter:${field}`]: value,
    };
    return ({
      pathname: getCollectionLink(collection),
      search: queryString.stringify(params),
      hash: queryString.stringify({ mode: collectionViewIds.SEARCH })
    });
  }

  const params = {
    [`filter:${field}`]: value,
  };

  return ({
    pathname: 'search',
    search: queryString.stringify(params)
  });
}
