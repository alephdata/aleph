// SPDX-FileCopyrightText: 2014 2014 Emma Prest, <emma@occrp.org> et al.
//
// SPDX-License-Identifier: MIT

import _ from 'lodash';

export default function ensureArray(value) {
  if (_.isNil(value)) {
    return [];
  }
  return _.castArray(value);
}
