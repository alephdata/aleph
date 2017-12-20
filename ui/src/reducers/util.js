import keyBy from 'lodash/keyBy';

export function mapById(result) {
  return result ? keyBy(result.results, 'id') : {};
}
