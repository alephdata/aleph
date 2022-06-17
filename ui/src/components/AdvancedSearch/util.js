// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
//
// SPDX-License-Identifier: MIT

export const FIELDS = [
  {
    key: 'all',
    re: /[^\s]+/g,
    process: t => t,
    compose: t => t,
  },
  {
    key: 'any',
    re: /[^\s]+( OR [^\s]+)+/g,
    process: t => t.split(" OR "),
    compose: (t, i) => i === 0 ? t : `OR ${t}`,
  },
  {
    key: 'none',
    re: /(^|\s)-[^\s]+/g,
    process: t => t.replace(/-/g,''),
    compose: t => `-${t.trim()}`,
  },
  {
    key: 'exact',
    re: /"[^"]+"/g,
    process: t => t.replace(/"/g,''),
    compose: t => `"${t}"`,
  },
  {
    key: 'variants',
    re: /[^\s]+~[0-9]+/g,
    process: t => t.match(/(?<term>[^\s]+)~(?<distance>[0-9]+)/).groups,
    compose: t => t?.term && t.distance && `${t.term}~${t.distance}`,
  },
  {
    key: 'proximity',
    re: /"[^\s]+ [^\s]+"~[0-9]+/g,
    process: t => t.match(/"(?<term>[^\s]+) (?<term2>[^\s]+)"~(?<distance>[0-9]+)/).groups,
    compose: t => t?.term && t.term2 && t.distance && `"${t.term} ${t.term2}"~${t.distance}`,
  },
];


export const parseQueryText = (queryText) => {
  const parsedResults = {};
  let qt = queryText;

  [...FIELDS].reverse().forEach(({ key, re, process }) => {
    const matches = qt.match(re) || [];
    parsedResults[key] = matches.map(process).flat()
    qt = qt.replace(re, '');
  })

  return parsedResults
}

export const composeQueryText = (queryParts) => {
  return FIELDS
    .map(({ key, compose }) => {
      if (queryParts[key]) {
        return queryParts[key].map(compose).join(' ');
      }
      return null;
    })
    .filter(x => x.length > 0)
    .join(' ');
}
