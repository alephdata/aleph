// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
//
// SPDX-License-Identifier: MIT

import { endpoint } from 'app/api';

// function reloadQuery(query, result) {
//   /* When the redux store is being mutated (see reducers/mutate),
//   all results will be reloaded. This becomes problematic, if the
//   user is looking at the lower end of an infinite scroll list: only
//   the first page might be reloaded, and the view would be reset. To
//   prevent this, we're adjusting the limit here to the max of the
//   number of loaded items. */
//   const limit = query.getInt('limit');
//   console.log('reload results', query.path, limit, result?.results?.length);
//   if (result?.results?.length > limit && !result.isPending) {
//     return query
//       .setString('offset', 0)
//       .setString('next_limit', limit)
//       .setString('limit', result.results.length);
//   }
//   return query;
// }

export async function queryEndpoint({ query, result, next }) {
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
