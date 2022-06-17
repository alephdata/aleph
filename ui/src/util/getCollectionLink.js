// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
//
// SPDX-License-Identifier: MIT

import queryString from 'query-string';

export default function getCollectionLink({ collection, mode, hash, search }) {
  if (!collection?.id) {
    return null;
  }
  const collectionId = collection.id;

  return ({
    pathname: collection.casefile ? `/investigations/${collectionId}` : `/datasets/${collectionId}`,
    hash: queryString.stringify({ mode, ...hash }),
    search
  });
}
