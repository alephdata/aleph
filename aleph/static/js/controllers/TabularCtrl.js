
aleph.controller('TabularCtrl', ['$scope', '$location', '$http', 'Metadata', 'Authz', 'data',
    function($scope, $location, $http, Metadata, Authz, data) {

  $scope.doc = data.doc;
  $scope.table = data.table;
  $scope.rows = data.rows;
  $scope.moreLoading = false;

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
