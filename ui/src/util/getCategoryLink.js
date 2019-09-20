
export default function getCategoryLink(collection) {
  if (collection.category) {
    return `/sources?collectionsfilter%3Acategory=${collection.category}`;
  }
  return null;
}
