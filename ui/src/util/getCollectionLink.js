import queryString from 'query-string';

export default function getCollectionLink(collection) {
  if (collection && collection.id) {
    if (collection.casefile) {
      return `/investigations/${collection.id}`;
    } else {
      return `/datasets/${collection.id}`;
    }
  }
  return null;
}
