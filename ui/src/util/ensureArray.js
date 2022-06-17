// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
//
// SPDX-License-Identifier: MIT

import _ from 'lodash';

export default function ensureArray(value) {
  if (_.isNil(value)) {
    return [];
  }
  return _.castArray(value);
}
