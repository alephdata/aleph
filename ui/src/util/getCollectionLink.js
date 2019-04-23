export default function getCollectionLink(collection) {
  if (collection.id) {
    return `/collections/${collection.id}`;
  }
  return null;
}
