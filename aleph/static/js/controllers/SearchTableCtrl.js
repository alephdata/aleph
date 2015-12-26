
aleph.controller('SearchTableCtrl', ['$scope', '$location', '$http', 'result',
  function($scope, $location, $http, result) {

  var isLoading = false;

  $scope.result = result;

  $scope.hasMore = function() {
    return !isLoading && $scope.result.next !== null;
  };

  $scope.loadMore = function() {
    if (!$scope.result.next) {
      return;
    }
    isLoading = true;
    $http.get($scope.result.next).then(function(res) {
      $scope.result.results = $scope.result.results.concat(res.data.results);
      $scope.result.next = res.data.next;
      isLoading = false;
    });
  };

}]);
