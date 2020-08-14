const fs = require('fs');
const READ_DIR = './i18n/translations/';
const WRITE_DIR = './src/content/';

fs.readdir(READ_DIR, (err, filenames) => {
  if (err) {
    throw err;
  }
  const output = {};
  filenames.forEach(filename => {
    const fileKey = filename.replace(/\.[^/.]+$/, "");
    const contents = fs.readFileSync(READ_DIR + filename);
    output[fileKey] = JSON.parse(contents)
  })

  const outputJSON = JSON.stringify(output);
  fs.writeFile(WRITE_DIR + 'translations.json', outputJSON, 'utf8', () => console.log('finished concatenating translations'));
});
