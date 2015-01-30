
aleph.controller('SearchCtrl', ['$scope', '$location', '$http',
  function($scope, $location, $http) {

  var isLoading = false;
  $scope.result = {};
  $scope.collections = [];
  
  $scope.load = function() {
    $scope.loadQuery();
    var query = angular.copy($scope.query);
    query['limit'] = 35;
    isLoading = true;
    $http.get('/api/1/query', {params: query}).then(function(res) {
      $scope.result = res.data;
      isLoading = false;
    });

    $http.get('/api/1/collections').then(function(res) {
      $scope.collections = res.data.results;
    });
  };

  $scope.hasMore = function() {
    return !isLoading && $scope.result.next_url !== null;
  };

  $scope.loadMore = function() {
    isLoading = true;
    $http.get($scope.result.next_url).then(function(res) {
      $scope.result.results = $scope.result.results.concat(res.data.results);
      $scope.result.next_url = res.data.next_url;
      isLoading = false;
    });
  };

  $scope.collectionCount = function() {
    return $scope.query.collection ? $scope.query.collection.length : $scope.collections.length;
  };

  $scope.load();

}]);

