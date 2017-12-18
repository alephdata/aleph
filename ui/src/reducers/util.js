import keyBy from 'lodash/keyBy';

// Given an API search result, return two objects:
// - result: the given result, but with nested objects replaced by their ids
// - objects: the objects pulled out of the result, mapped by their id.
export function normaliseSearchResult(result) {
  const objects = result ? keyBy(result.results, 'id') : {};

  const normalisedResult = { ...result };
  if (normalisedResult.results !== undefined) {
    normalisedResult.results = result.results.map(doc => doc.id);
  }

  return {
    result: normalisedResult,
    objects,
  };
}
