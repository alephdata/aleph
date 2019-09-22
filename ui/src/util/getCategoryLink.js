
export default function getCategoryLink(collection) {
  if (collection.category) {
    return `/datasets?collectionsfilter%3Acategory=${collection.category}`;
  }
  return null;
}
