// SPDX-FileCopyrightText: 2014 2014 Emma Prest, <emma@occrp.org> et al.
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
