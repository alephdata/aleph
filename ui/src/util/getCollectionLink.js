import queryString from 'query-string';

export default function getCollectionLink({ collection, mode, hash, search }) {
  if (!collection?.id) {
    return null;
  }
  const collectionId = collection.id;

  return {
    pathname: collection.casefile
      ? `/investigations/${collectionId}`
      : `/datasets/${collectionId}`,
    hash: queryString.stringify({ mode, ...hash }),
    search,
  };
}
