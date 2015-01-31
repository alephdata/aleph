
aleph.controller('SearchCtrl', ['$scope', '$location', '$http',
  function($scope, $location, $http) {

  var isLoading = false;
  $scope.result = {};
  $scope.collections = {};

  $http.get('/api/1/collections').then(function(res) {
    var collections = {}
    angular.forEach(res.data.results, function(c) {
      collections[c.slug] = c;
    });
    $scope.collections = collections;
  });
  
  $scope.load = function() {
    $scope.loadQuery();
    var query = angular.copy($scope.query);
    query['limit'] = 35;
    isLoading = true;
    $http.get('/api/1/query', {params: query}).then(function(res) {
      $scope.result = res.data;
      isLoading = false;
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

  $scope.toggleCollectionFilter = function(slug) {
    var idx = $scope.query.collection.indexOf(slug);
    if (idx == -1) {
      $scope.query.collection.push(slug);
    } else {
      $scope.query.collection.splice(idx, 1);
    }
    $scope.submitSearch();
  };

  $scope.hasCollectionFilter = function(slug) {
    return $scope.query.collection.indexOf(slug) != -1;
  };

  $scope.load();

}]);

