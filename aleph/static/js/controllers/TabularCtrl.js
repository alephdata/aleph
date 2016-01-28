/* 

* Fixed headers
* [DONE] Multiple sheets
* Cell value formatting
* Highlight selected row
* Filter globally
* Filter by field
* Facet by field

*/ 

aleph.controller('TabularCtrl', ['$scope', '$location', '$http', 'Metadata', 'Authz', 'data',
    function($scope, $location, $http, Metadata, Authz, data) {

  $scope.doc = data.doc;
  $scope.table = data.table;
  $scope.rows = data.rows;
  $scope.moreLoading = false;

  $scope.getClass = function(row, col) {
    var value = row[col.name];
    if (value === null || value === undefined) {
      return;
    }
    if (!isNaN(filterFloat(value))) {
      return 'numeric';
    }
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
