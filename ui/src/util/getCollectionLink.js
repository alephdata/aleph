export default function getCollectionLink(collection) {
  if (collection.id) {
    return `/datasets/${collection.id}`;
  }
  return null;
}
