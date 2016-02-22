
aleph.controller('TabularCtrl', ['$scope', '$location', '$http', '$sce', '$filter', 'Metadata', 'Authz', 'Title', 'data',
    function($scope, $location, $http, $sce, $filter, Metadata, Authz, Title, data) {

  $scope.doc = data.doc;
  $scope.table = data.table;
  $scope.rows = data.rows;
  $scope.moreLoading = false;
  $scope.textQuery = $location.search().dq;

  Title.set(data.doc.title || data.doc.file_name);

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
    // if (!isNaN(filterFloat(value))) {
    //   return $filter('number')(value);
    // }
    return value;
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

  $scope.loadMore = function() {
    if (!$scope.rows.next_url || $scope.moreLoading) {
      return;
    }
    $scope.moreLoading = true;
    $scope.reportLoading(true);
    $http.get($scope.rows.next_url).then(function(res) {
      $scope.rows.results = $scope.rows.results.concat(res.data.results);
      $scope.rows.next_url = res.data.next_url;
      $scope.moreLoading = false;
      $scope.reportLoading(false);
    });
  };


}]);
