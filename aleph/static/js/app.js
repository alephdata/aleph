var aleph = angular.module('aleph', ['ngRoute', 'ngAnimate', 'ui.bootstrap', 'debounce', 'truncate', 'infinite-scroll']);

aleph.config(['$routeProvider', '$locationProvider',
    function($routeProvider, $locationProvider) {

  $routeProvider.when('/search', {
    templateUrl: 'search.html',
    controller: 'SearchCtrl',
    reloadOnSearch: false,
    loginRequired: false
  });

  $routeProvider.when('/graph', {
    templateUrl: 'graph.html',
    controller: 'GraphCtrl',
    reloadOnSearch: false,
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


aleph.directive('entityIcon', ['$http', function($http) {
  return {
    restrict: 'E',
    transclude: true,
    scope: {
      'category': '='
    },
    templateUrl: 'entity_icon.html',
    link: function (scope, element, attrs, model) {
    }
  };
}]);
