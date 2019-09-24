import queryString from 'query-string';

export default function togglePreview(history, entity) {
  const { location } = history;
  const parsed = queryString.parse(location.hash);
  parsed['preview:mode'] = undefined;
  if (entity) {
    parsed['preview:id'] = parsed['preview:id'] === entity.id ? undefined : entity.id;
  } else {
    parsed['preview:id'] = undefined;
    parsed.page = undefined;
  }
  history.push({
    pathname: location.pathname,
    search: location.search,
    hash: queryString.stringify(parsed),
  });
}
