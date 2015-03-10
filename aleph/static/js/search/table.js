
aleph.controller('SearchTableCtrl', ['$scope', '$location', '$http', 'result', 'sources',
  function($scope, $location, $http, result, sources) {

  var isLoading = false;

  $scope.result = result;
  $scope.sources = sources;
  
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
