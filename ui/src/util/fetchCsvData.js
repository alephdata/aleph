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
