
aleph.controller('SearchCtrl', ['$scope', '$location', '$http',
  function($scope, $location, $http) {

  var isLoading = false,
      collectionCount = 0;
  $scope.result = {};
  $scope.collections = {};

  $http.get('/api/1/collections').then(function(res) {
    var collections = {}
    angular.forEach(res.data.results, function(c) {
      collections[c.slug] = c;
    });
    $scope.collections = collections;
    collectionCount = res.data.total;
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

  $scope.toggleFilter = function(name, val) {
    var idx = $scope.query[name].indexOf(val);
    if (idx == -1) {
      $scope.query[name].push(val);
    } else {
      $scope.query[name].splice(idx, 1);
    }
    $scope.submitSearch();
  };

  $scope.hasFilter = function(name, val) {
    return $scope.query[name].indexOf(val) != -1;
  };

  $scope.numQueriedCollections = function() {
    return $scope.query.collection.length || collectionCount;
  };

  $scope.load();

}]);

