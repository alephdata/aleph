export default function getCategoryLink(category) {
  if (category === 'casefile') {
    return '/investigations';
  }
  return `/datasets?collectionsfilter%3Acategory=${category}`;
}
