
aleph.controller('SearchTableCtrl', ['$scope', '$location', '$http', 'result', 'collections', 'Query',
  function($scope, $location, $http, result, collections, Query) {

  var isLoading = false;

  $scope.result = result;
  $scope.collections = collections;
  $scope.query = Query;

  $scope.hasMore = function() {
    return !isLoading && $scope.result.next_url !== null;
  };

  $scope.loadMore = function() {
    if (!$scope.result.next_url) {
      return;
    }
    isLoading = true;
    $http.get($scope.result.next_url).then(function(res) {
      $scope.result.results = $scope.result.results.concat(res.data.results);
      $scope.result.next_url = res.data.next_url;
      isLoading = false;
    });
  };

}]);
