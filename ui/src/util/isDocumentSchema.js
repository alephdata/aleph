// FIXME: give better metadata from API.
const DOCUMENT_SCHEMATA = ['Document', 'Pages', 'Folder', 'Package', 'Email', 'HyperText', 'Workbook', 'Table', 'PlainText', 'Image', 'Video', 'Audio'];

export default function isDocumentSchema(schema) {
  return DOCUMENT_SCHEMATA.indexOf(schema) !== -1;
}