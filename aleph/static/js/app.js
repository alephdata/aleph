var aleph = angular.module('aleph', ['ngRoute', 'ngAnimate', 'ui.bootstrap', 'truncate', 'infinite-scroll']);

aleph.config(['$routeProvider', '$locationProvider',
    function($routeProvider, $locationProvider) {

  $routeProvider.when('/search', {
    templateUrl: 'search.html',
    controller: 'SearchCtrl',
    loginRequired: false
  });

  $routeProvider.when('/collections', {
    templateUrl: 'collections_index.html',
    controller: 'CollectionsIndexCtrl',
    loginRequired: false
  });

  $routeProvider.when('/collections/:slug', {
    templateUrl: 'collections_edit.html',
    controller: 'CollectionsEditCtrl',
    loginRequired: false
  });

  $routeProvider.otherwise({
    redirectTo: '/search',
    loginRequired: false
  });

  $locationProvider.html5Mode(true);
}]);

