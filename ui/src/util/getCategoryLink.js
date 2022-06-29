// SPDX-FileCopyrightText: 2014 2014 Emma Prest, <emma@occrp.org> et al.
//
// SPDX-License-Identifier: MIT

export default function getCategoryLink(category) {
  if (category === 'casefile') {
    return '/investigations'
  }
  return `/datasets?collectionsfilter%3Acategory=${category}`;
}
