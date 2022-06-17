// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
//
// SPDX-License-Identifier: MIT

/*
 * https://stackoverflow.com/questions/23618744/rendering-comma-separated-list-of-links
 */
export default function wordList(arr, sep) {
  if (arr.length === 0) {
    return [];
  }
  return arr.slice(1).reduce((xs, x) => xs.concat([sep, x]), [arr[0]]);
}
