import queryString from 'query-string';

export default function getProfileLink(profileId, hashQuery) {
  const fragment = queryString.stringify(hashQuery || {});
  return `/profiles/${profileId}#${fragment}`;
}
