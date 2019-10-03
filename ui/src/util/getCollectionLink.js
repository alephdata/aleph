export default function getCollectionLink(collection) {
  return (collection && collection.id) ? `/datasets/${collection.id}` : null;
}
