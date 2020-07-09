import queryString from 'query-string';

export default function getStatLink(collection, field, value,) {
  const params = {
    [`filter:${field}`]: value,
  };
  if (collection) {
    params['filter:collection_id'] = collection.id;
  }
  const query = queryString.stringify(params);
  return `/search?${query}`;
}
