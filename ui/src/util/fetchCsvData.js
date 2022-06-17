// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
//
// SPDX-License-Identifier: MIT

import Papa from 'papaparse';

export default function fetchCsvData(url, callback) {
  // set chunk size to 100 KB
  Papa.RemoteChunkSize = 1024 * 100;
  Papa.parse(url, {
    download: true,
    delimiter: ',',
    newline: '\n',
    encoding: 'utf-8',
    chunk: callback,
  });
}
