
aleph.controller('SearchTableCtrl', ['$scope', '$location', '$http', 'result', 'context',
  function($scope, $location, $http, result, context) {

  var isLoading = false;

  $scope.result = result;
  $scope.sources = context.sources;
  
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
