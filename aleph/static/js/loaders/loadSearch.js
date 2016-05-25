
var loadSearch = ['$http', '$q', '$route', '$location', 'Document',
    function($http, $q, $route, $location, Document) {
  return Document.search();
}];
