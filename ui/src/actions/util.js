import { endpoint } from 'app/api';

export const MAX_RESULTS = 9999;

export async function queryEndpoint({ query, next }) {
  // run a standard Query object against the API endpoint
  // given by `path`. If the argument `next` is given, it
  // will be used instead of generating a URI.

  if (next) {
    const response = await endpoint.get(next);
    return { query, result: response.data };
  }
  const response = await endpoint.get(query.path, {
    params: query.toParams(),
  });
  return { query, result: response.data };
}
