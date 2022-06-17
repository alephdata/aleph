// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
//
// SPDX-License-Identifier: MIT

import queryString from 'query-string';

export default function getValueLink(type, value) {
  const params = {
    [`filter:${type.group}`]: value,
    facet: 'collection_id',
    'facet_size:collection_id': 10,
    'facet_total:collection_id': true,
  };
  const query = queryString.stringify(params);
  return `/search?${query}`;
}
