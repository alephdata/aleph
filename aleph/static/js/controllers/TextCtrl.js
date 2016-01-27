
aleph.controller('TextCtrl', ['$scope', '$location', '$http', 'metadata', 'Authz', 'Document', 'data', 'pages',
    function($scope, $location, $http, metadata, Authz, Document, data, pages) {

  $scope.doc = data.doc;
  $scope.pages = pages;

  $scope.loading = true;
  $scope.pageNum = $location.search().page || 1;
  $scope.textQuery = $location.search().pq || $location.search().q;
  $scope.reportLoading(true);
  $scope.pdfUrl = '/api/1/documents/' + data.doc.id + '/pdf';

  $scope.onError = function(error) {
    $scope.reportError("Could not load document.");
  }

  $scope.onLoad = function() {
    $scope.loading = false;
    $scope.reportLoading(false);
  }

  $scope.$watch('pageNum', function(pg) {
    var q = $location.search();
    q.page = pg;
    $location.search(q);
  });

  $scope.setPage = function(page) {
    $scope.pageNum = page;
  };

  $scope.updateTextQuery = function() {
    var q = $location.search();
    q.pq = $scope.textQuery;
    q.q = null; // wat.
    $location.search(q);  
  };

  $scope.$on('$locationChangeStart', function() {
    var query = $location.search();
    $scope.pageNum = query.page || 1;
    $scope.textQuery = query.pq || query.q;
    Document.queryPages(data.doc.id, query).then(function(pages) {
      $scope.pages = pages;  
    });
  });

}]);
