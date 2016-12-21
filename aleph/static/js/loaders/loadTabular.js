var loadTabular = ['$http', '$q', '$route', '$location', 'Document',
    function($http, $q, $route, $location, Document) {

  var dfd = $q.defer(),
      documentId = $route.current.params.document_id,
      tableId = $route.current.params.table_id;

  Document.get(documentId).then(function(doc) {
    var table = null;
    for (var idx in doc.tables) {
      if (idx == tableId) {
        table = doc.tables[idx];
      }
    }

    var rowsUrl = '/api/1/documents/' + documentId + '/tables/' + tableId + '/rows',
        q = $location.search();
    q.q = q.dq;
    q.limit = 30;
    q.offset = $location.search().offset || 0;
    $http.get(rowsUrl, {cache: true, params: q}).then(function(res) {
      dfd.resolve({
        doc: doc,
        table: table,
        rows: res.data
      });
    }, function(err) {
      dfd.reject(err);
    });
  }, function(err) {
    dfd.reject(err);
  });
  return dfd.promise;
}];

export default loadTabular;
