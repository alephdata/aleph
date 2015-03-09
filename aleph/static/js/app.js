var aleph = angular.module('aleph', ['ngRoute', 'ngAnimate', 'angular-loading-bar', 'ui.bootstrap',
                                     'debounce', 'truncate', 'infinite-scroll']);

aleph.config(['$routeProvider', '$locationProvider',
    function($routeProvider, $locationProvider) {

  $routeProvider.when('/search', {
    templateUrl: 'search_table.html',
    controller: 'SearchTableCtrl',
    reloadOnSearch: true,
    loginRequired: false,
    resolve: {
      'collections': loadSearchCollections,
      'result': loadSearchResult
    }
  });

  $routeProvider.when('/search/export', {
    templateUrl: 'search_export.html',
    controller: 'SearchExportCtrl',
    reloadOnSearch: true,
    loginRequired: false,
    resolve: {
      'collections': loadSearchCollections,
      'result': loadSearchResult,
      'attributes': loadSearchAttributes
    }
  });

  $routeProvider.when('/search/graph', {
    templateUrl: 'search_graph.html',
    controller: 'SearchGraphCtrl',
    reloadOnSearch: true,
    loginRequired: false,
    resolve: {
      'collections': loadSearchCollections,
      'result': loadSearchResult,
      'graph': loadSearchGraph
    }
  });
  
  $routeProvider.when('/collections', {
    templateUrl: 'collections_index.html',
    controller: 'CollectionsIndexCtrl',
    loginRequired: true
  });

  $routeProvider.when('/collections/:slug', {
    templateUrl: 'collections_edit.html',
    controller: 'CollectionsEditCtrl',
    loginRequired: true
  });

  $routeProvider.when('/lists', {
    templateUrl: 'lists_index.html',
    controller: 'ListsIndexCtrl',
    loginRequired: true
  });

  $routeProvider.when('/lists/new', {
    templateUrl: 'lists_new.html',
    controller: 'ListsNewCtrl',
    loginRequired: true
  });

  $routeProvider.when('/lists/:id', {
    templateUrl: 'lists_edit.html',
    controller: 'ListsEditCtrl',
    loginRequired: true
  });

  $routeProvider.when('/lists/:id/entities', {
    templateUrl: 'lists_entities.html',
    controller: 'ListsEntitiesCtrl',
    reloadOnSearch: false,
    loginRequired: true
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
