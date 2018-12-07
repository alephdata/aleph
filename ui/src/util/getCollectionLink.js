export default function getCollectionLink(collection) {
  return { pathname: '/collections/' + collection.id };
}