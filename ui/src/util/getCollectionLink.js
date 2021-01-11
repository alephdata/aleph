import queryString from 'query-string';

export default function getCollectionLink(collection, hash) {
  if (collection && collection.id) {
    const hashSuffix = hash && queryString.stringify(hash);
    let base;
    if (collection.casefile) {
      base = `/investigations/${collection.id}`;
    } else {
      base = `/datasets/${collection.id}`;
    }
    return hashSuffix ? `${base}#${hashSuffix}` : base;
  }
  return null;
}
