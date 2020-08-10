const fs = require('fs');
const jq = require('node-jq');

const READ_DIR = './i18n/translations/';
const WRITE_DIR = './src/content/';

fs.readdir(READ_DIR, (err, filenames) => {
  if (err) {
    throw err;
  }
  const filepaths = filenames.map(filename => READ_DIR + filename)
  const first = filenames[0].replace(READ_DIR, '').replace('.json', '');
  const filter = `reduce inputs as $s ({${first}: .}; (.[input_filename|ltrimstr("${READ_DIR}")|rtrimstr(".json")]) += $s)`;

  jq.run(filter, filepaths, { output: 'compact' })
    .then((output) => {
      fs.writeFile(WRITE_DIR + 'translations.json', output, 'utf8', () => console.log('finished concatenating translations!'));
    })
    .catch((err) => {
      throw err;
    })
});
