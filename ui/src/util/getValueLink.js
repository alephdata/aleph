import queryString from 'query-string';

export default function getValueLink(type, value) {
  const params = {
    [`filter:${type.group}`]: value,
    facet: 'collection_id',
    'facet_size:collection_id': 10,
    'facet_total:collection_id': true,
  };
  const query = queryString.stringify(params);
  return `/search?${query}`;
}
