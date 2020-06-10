import queryString from 'query-string';

export default function getStatLink(collection, field, value,) {
  const params = {
    [`filter:${field}`]: value,
    'facet': field,
    [`facet_size:${field}`]: 1000,
    [`facet_total:${field}`]: true,
  };
  if (collection) {
    params['filter:collection_id'] = collection.id;
  }
  const query = queryString.stringify(params);
  return `/search?${query}`;
}
