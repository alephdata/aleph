import isNil from 'lodash/isNil';
import castArray from 'lodash/castArray';
import type { Values } from '@alephdata/followthemoney';

export function ensureArray(values: Values) {
  if (isNil(values)) {
    return [];
  }
  return castArray(values);
}
