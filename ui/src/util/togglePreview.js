// SPDX-FileCopyrightText: 2014 2014 Emma Prest, <emma@occrp.org> et al.
//
// SPDX-License-Identifier: MIT

import queryString from 'query-string';

export default function togglePreview(navigate, location, entity, profile) {
  const parsed = queryString.parse(location.hash);
  parsed['preview:mode'] = undefined;
  if (entity) {
    parsed['preview:id'] = parsed['preview:id'] === entity.id ? undefined : entity.id;
    parsed['preview:profile'] = profile;
  } else {
    parsed['preview:id'] = undefined;
    parsed['preview:profile'] = undefined;
    parsed.page = undefined;
  }
  navigate({
    pathname: location.pathname,
    search: location.search,
    hash: queryString.stringify(parsed),
  });
}
