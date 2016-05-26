var aleph = angular.module('aleph', ['ngRoute', 'ngAnimate', 'ngSanitize', 'ui.bootstrap',
                                     'angular-loading-bar', 'truncate', 'pdf']);

aleph.config(['$routeProvider', '$locationProvider', '$compileProvider', 'cfpLoadingBarProvider',
    function($routeProvider, $locationProvider, $compileProvider, cfpLoadingBarProvider) {

  $routeProvider.when('/search', {
    templateUrl: 'templates/search.html',
    controller: 'SearchCtrl',
    reloadOnSearch: false,
    loginRequired: false,
    resolve: {
      'data': loadSearch,
      'metadata': loadMetadata
    }
  });

  $routeProvider.when('/tabular/:document_id/:table_id', {
    templateUrl: 'templates/tabular.html',
    controller: 'TabularCtrl',
    reloadOnSearch: true,
    loginRequired: false,
    resolve: {
      'data': loadTabular,
      'metadata': loadMetadata,
      'references': loadReferences
    }
  });

  $routeProvider.when('/text/:document_id', {
    templateUrl: 'templates/text.html',
    controller: 'TextCtrl',
    reloadOnSearch: false,
    loginRequired: false,
    resolve: {
      'data': loadText,
      'metadata': loadMetadata,
      'pages': loadPagesQuery,
      'references': loadReferences
    }
  });

  $routeProvider.when('/entities', {
    templateUrl: 'templates/entity_index.html',
    controller: 'EntitiesIndexCtrl',
    reloadOnSearch: false,
    loginRequired: false,
    resolve: {
      'data': loadEntitiesIndex,
      'metadata': loadMetadata
    }
  });

  $routeProvider.when('/entities/review', {
    templateUrl: 'templates/entity_review.html',
    controller: 'EntitiesReviewCtrl',
    reloadOnSearch: true,
    loginRequired: false,
    resolve: {
      'metadata': loadMetadata
    }
  });

  $routeProvider.when('/entities/bulk', {
    templateUrl: 'templates/entity_bulk.html',
    controller: 'EntitiesBulkCtrl',
    reloadOnSearch: true,
    loginRequired: false,
    resolve: {
      'metadata': loadMetadata
    }
  });

  $routeProvider.when('/crawlers', {
    templateUrl: 'templates/crawlers_manage.html',
    controller: 'CrawlersManageCtrl',
    reloadOnSearch: false,
    loginRequired: false,
    resolve: {
      'crawlers': loadCrawlers
    }
  });

  $routeProvider.when('/crawlers/logs', {
    templateUrl: 'templates/crawlers_states.html',
    controller: 'CrawlersStatesCtrl',
    reloadOnSearch: true,
    loginRequired: false,
    resolve: {
      // 'crawlers': loadCrawlers,
      'states': loadCrawlerStates
    }
  });

  $routeProvider.when('/help/:page', {
    templateUrl: 'templates/help.html',
    controller: 'HelpCtrl',
    reloadOnSearch: false,
    loginRequired: false,
    resolve: {}
  });

  $routeProvider.when('/help', {
    templateUrl: 'templates/help.html',
    controller: 'HelpCtrl',
    reloadOnSearch: false,
    loginRequired: false,
    resolve: {}
  });

  $routeProvider.when('/', {
    templateUrl: 'templates/home.html',
    controller: 'HomeCtrl',
    reloadOnSearch: false,
    loginRequired: false,
    resolve: {
      'data': loadHome,
      'metadata': loadMetadata
    }
  });

  $locationProvider.html5Mode(true);
  $compileProvider.debugInfoEnabled(false);
  cfpLoadingBarProvider.includeSpinner = false;
  cfpLoadingBarProvider.latencyThreshold = 100;
}]);
