import { get } from 'lodash/fp';

export function selectResult(state, query) {
  return get(['search', keyForQuery(query), 'result'])(state);
}

export function selectFacet(state, { query, field }) {
  return get(['search', keyForQuery(query), 'facets', field])(state);
}

// Not really a selector; but needed both here and in the search reducer.
export function keyForQuery(query) {
  return query
    .clear('limit')
    .clear('offset')
    .toString()
}
