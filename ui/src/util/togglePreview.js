import queryString from 'query-string';

export default function togglePreview(history, previewObject, previewType) {
  const location = history.location;
  const parsedHash = queryString.parse(location.hash);
  parsedHash['preview:mode'] = undefined;

  if (parsedHash['preview:id'] === previewObject.id && parsedHash['preview:type'] === previewType) {
    parsedHash['preview:id'] = undefined;
    parsedHash['preview:type'] = undefined;
  } else {
    parsedHash['preview:id'] = previewObject.id;
    parsedHash['preview:type'] = previewType;
  }

  history.push({
    pathname: location.pathname,
    search: location.search,
    hash: queryString.stringify(parsedHash),
  });
}