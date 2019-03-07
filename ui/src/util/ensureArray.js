import _ from 'lodash';

export default function ensureArray(value) {
  if (_.isNil(value)) {
    return [];
  }
  return _.castArray(value);
}
