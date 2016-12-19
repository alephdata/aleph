var loadDocumentsSearch = ['Document', function(Document) {
  return Document.search();
}];

var loadPeek = ['Document', function(Document) {
  return Document.peek();
}];

export {loadDocumentsSearch, loadPeek};
