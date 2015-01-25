var aleph = angular.module('aleph', ['ngRoute', 'ngAnimate', 'ui.bootstrap', 'truncate']);

aleph.config(['$routeProvider', '$locationProvider',
    function($routeProvider, $locationProvider) {

  $routeProvider.when('/search', {
    templateUrl: 'search.html',
    controller: 'SearchCtrl'
  });

  $routeProvider.otherwise({
    redirectTo: '/search'
  });

  $locationProvider.html5Mode(true);
}]);


aleph.controller('AppCtrl', ['$scope', '$location', '$http',
  function($scope, $location, $http) {

}]);


aleph.controller('SearchCtrl', ['$scope', '$location', '$http',
  function($scope, $location, $http) {

  $scope.query = {};
  $scope.result = {};

  $scope.load = function() {
    $scope.query = $location.search();
    $http.get('/api/1/query', {params: $scope.query}).then(function(res) {
      $scope.result = res.data;
    });
  };

  $scope.update = function() {
    $location.search($scope.query);
  }

  $scope.load();
}]);
