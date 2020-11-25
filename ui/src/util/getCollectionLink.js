export default function getCollectionLink(collection) {
  if (!collection?.id) {
    return null;
  }
  return collection.casefile ? `/investigations/${collection.id}` : `/datasets/${collection.id}`;
}
