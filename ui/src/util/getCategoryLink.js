// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
//
// SPDX-License-Identifier: MIT

export default function getCategoryLink(category) {
  if (category === 'casefile') {
    return '/investigations'
  }
  return `/datasets?collectionsfilter%3Acategory=${category}`;
}
