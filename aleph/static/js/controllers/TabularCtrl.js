
aleph.controller('TabularCtrl', ['$scope', '$location', '$http', '$sce', '$sanitize', '$filter', 'Authz', 'Title', 'History', 'data', 'references',
    function($scope, $location, $http, $sce, $sanitize, $filter, Authz, Title, History, data, references) {

  $scope.doc = data.doc;
  $scope.table = data.table;
  $scope.rows = data.rows;
  $scope.references = references;
  $scope.moreLoading = false;
  $scope.searchCtx = $location.search().ctx;
  $scope.textQuery = $location.search().dq;

  Title.set(data.doc.title || data.doc.file_name, "documents");

  $scope.getClass = function(row, col) {
    var value = row[col.name];
    if (value === null || value === undefined) {
      return;
    }
    if (!isNaN(filterFloat(value))) {
      return 'numeric';
    }
  };

  $scope.formatCell = function(row, col) {
    var value = row[col.name];
    if (value === null || value === undefined) {
      return;
    }
    if (value.toLowerCase().startsWith('http://') || value.toLowerCase().startsWith('https://')) {
      value = '<a target="_new" href=' + value + '>' + $sanitize(value) + '</a>'
      return $sce.trustAsHtml(value);
    }
    // if (!isNaN(filterFloat(value))) {
    //   return $filter('number')(value);
    // }
    return $sce.trustAsHtml($sanitize(value));
  };

  $scope.backToSearch = function() {
    $location.path('/search');
    $location.search(History.getLastSearch());
  };

  $scope.updateQuery = function() {
    var q = $location.search();
    q.dq = $scope.textQuery;
    // q.q = null; // wat.
    q.row = null;
    $location.search(q);  
  };

  $scope.isHighlighted = function(row) {
    var rows = ensureArray($location.search().row), 
        id = row._id + '';
    return rows.indexOf(id) !== -1;
  };

  $scope.loadOffset = function(offset) {
    var query = $location.search();
    query.offset = offset;
    $location.search(query);
  };

}]);
