var aleph = angular.module('aleph', ['ngRoute', 'ngAnimate', 'angular-loading-bar', 'ui.bootstrap',
                                     'debounce', 'truncate', 'infinite-scroll']);

aleph.config(['$routeProvider', '$locationProvider', 'cfpLoadingBarProvider',
    function($routeProvider, $locationProvider, cfpLoadingBarProvider) {

  cfpLoadingBarProvider.includeSpinner = false;

  $routeProvider.when('/search', {
    templateUrl: 'search_table.html',
    controller: 'SearchTableCtrl',
    reloadOnSearch: false,
    loginRequired: false,
    resolve: {
      'result': loadSearchResult
    }
  });

  $routeProvider.when('/search/export', {
    templateUrl: 'search_export.html',
    controller: 'SearchExportCtrl',
    reloadOnSearch: false,
    loginRequired: false,
    resolve: {
      'result': loadSearchResult,
      'metadata': loadMetadata
    }
  });

  $routeProvider.when('/search/graph', {
    templateUrl: 'search_graph.html',
    controller: 'SearchGraphCtrl',
    reloadOnSearch: false,
    loginRequired: false,
    resolve: {
      'result': loadSearchResult,
      'graph': loadSearchGraph
    }
  });

  $routeProvider.when('/sources', {
    templateUrl: 'sources_index.html',
    controller: 'SourcesIndexCtrl',
    loginRequired: true
  });

  $routeProvider.when('/sources/new', {
    templateUrl: 'sources_new.html',
    controller: 'SourcesNewCtrl',
    loginRequired: true,
    resolve: {
    }
  });

  $routeProvider.when('/sources/:slug', {
    templateUrl: 'sources_edit.html',
    controller: 'SourcesEditCtrl',
    loginRequired: true,
    resolve: {
      'users': loadUsers,
      'source': loadSource
    }
  });

  $routeProvider.when('/watchlists/new', {
    templateUrl: 'watchlists_new.html',
    controller: 'WatchlistsNewCtrl',
    loginRequired: true
  });

  $routeProvider.when('/watchlists/:id', {
    templateUrl: 'watchlists_edit.html',
    controller: 'WatchlistsEditCtrl',
    loginRequired: true
  });

  $routeProvider.when('/watchlists/:id/entities', {
    templateUrl: 'watchlists_entities.html',
    controller: 'WatchlistsEntitiesCtrl',
    reloadOnSearch: false,
    loginRequired: true
  });

  $routeProvider.otherwise({
    redirectTo: '/search',
    loginRequired: false
  });

  $locationProvider.html5Mode(false);
}]);
