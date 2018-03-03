import { endpoint } from 'src/app/api';

export async function queryEndpoint(path, {query, next, result}) {
  // run a standard Query object against the API endpoint 
  // given by `path`. If the argument `next` is given, it
  // will be used instead of generating a URI.
  if (next) {
    const response = await endpoint.get(next);
    return {
      query,
      nextResult: response.data,
      prevResult: result
    };
  } else {
    const response = await endpoint.get(path, {
      params: query.toParams()
    });
    return {
      query,
      nextResult: response.data,
      prevResult: result
    };
  }
} 