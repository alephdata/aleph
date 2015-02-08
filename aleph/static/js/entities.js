
aleph.controller('ListsEntitiesCtrl', ['$scope', '$location', '$http', '$routeParams',
  function($scope, $location, $http, $routeParams) {
  
  var apiUrl = '/api/1/lists/' + $routeParams.id;
  $scope.query = {'list': $routeParams.id, 'prefix': ''};
  $scope.list = {};
  $scope.entities = {};

  $http.get(apiUrl).then(function(res) {
    $scope.list = res.data;
  });

  $scope.filter = function() {
    $http.get('/api/1/entities', {params: $scope.query}).then(function(res) {
      $scope.entities = res.data;
    });
  };

  $scope.delete = function(entity) {
    $http.delete(entity.api_url).then(function(res) {
      var idx = $scope.entities.results.indexOf(entity);
      $scope.entities.results.splice(idx, 1);
    });
  };

  $scope.filter();

}]);
