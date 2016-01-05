var aleph = angular.module('aleph', ['ngRoute', 'ngAnimate', 'angular-loading-bar', 'ui.bootstrap',
                                     'debounce', 'truncate', 'infinite-scroll']);

aleph.config(['$routeProvider', '$locationProvider', 'cfpLoadingBarProvider',
    function($routeProvider, $locationProvider, cfpLoadingBarProvider) {

  cfpLoadingBarProvider.includeSpinner = false;

  $routeProvider.when('/search', {
    templateUrl: 'search.html',
    controller: 'SearchCtrl',
    reloadOnSearch: true,
    loginRequired: false,
    resolve: {
      'result': loadSearch
    }
  });

  $routeProvider.when('/tabular/:document_id/:sheet_id', {
    templateUrl: 'tabular.html',
    controller: 'TabularCtrl',
    reloadOnSearch: true,
    loginRequired: false,
    resolve: {
      'doc': loadDocument
    }
  });

  $routeProvider.when('/text/:document_id', {
    templateUrl: 'text.html',
    controller: 'TextCtrl',
    reloadOnSearch: true,
    loginRequired: false,
    resolve: {
      'doc': loadDocument
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
