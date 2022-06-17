// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
//
// SPDX-License-Identifier: MIT

const fs = require('fs');
const path = require('path');

const READ_DIR = './i18n/translations/compiled/';
const WRITE_DIR = './src/content/';

fs.readdir(READ_DIR, (err, filenames) => {
  if (err) {
    throw err;
  }
  const output = {};
  filenames.forEach(filename => {
    const { ext, name } = path.parse(filename)
    if (ext === '.json') {
      const contents = fs.readFileSync(READ_DIR + filename);
      output[name] = JSON.parse(contents)
    }
  })

  const outputJSON = JSON.stringify(output);
  fs.writeFile(WRITE_DIR + 'translations.json', outputJSON, 'utf8', () => console.log('finished concatenating translations'));
});
