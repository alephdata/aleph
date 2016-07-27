var aleph = angular.module('aleph', ['ngRoute', 'ngAnimate', 'ngSanitize', 'ui.bootstrap',
                                     'ui.select', 'angular-loading-bar', 'ngFileUpload',
                                     'truncate', 'pdf']);

aleph.config(['$routeProvider', '$locationProvider', '$compileProvider', 'cfpLoadingBarProvider', 'uiSelectConfig',
    function($routeProvider, $locationProvider, $compileProvider, cfpLoadingBarProvider, uiSelectConfig) {

  $routeProvider.when('/search', {
    templateUrl: 'templates/search.html',
    controller: 'SearchCtrl',
    reloadOnSearch: false,
    loginRequired: false,
    resolve: {
      'data': loadSearch,
      'peek': loadPeek,
      'metadata': loadMetadata,
      'alerts': loadAlertsIndex
    }
  });

  $routeProvider.when('/tabular/:document_id/:table_id', {
    templateUrl: 'templates/tabular.html',
    controller: 'TabularCtrl',
    reloadOnSearch: true,
    loginRequired: false,
    resolve: {
      'data': loadTabular,
      'metadata': loadMetadata
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
      'pages': loadPagesQuery
    }
  });

  $routeProvider.when('/collections', {
    templateUrl: 'templates/collections_index.html',
    controller: 'CollectionsIndexCtrl',
    reloadOnSearch: false,
    loginRequired: false,
    resolve: {
      'collections': loadCollections,
      'metadata': loadMetadata
    }
  });

  $routeProvider.when('/collections/:collection_id', {
    templateUrl: 'templates/collections_view.html',
    controller: 'CollectionsViewCtrl',
    reloadOnSearch: false,
    loginRequired: false,
    resolve: {
      'collection': loadCollection,
      'metadata': loadMetadata
    }
  });

  $routeProvider.when('/collections/:collection_id/review', {
    templateUrl: 'templates/entity_review.html',
    controller: 'EntitiesReviewCtrl',
    reloadOnSearch: false,
    loginRequired: false,
    resolve: {
      'collection': loadCollection,
      'metadata': loadMetadata
    }
  });

  $routeProvider.when('/collections/:collection_id/entities/bulk', {
    templateUrl: 'templates/entity_bulk.html',
    controller: 'EntitiesBulkCtrl',
    reloadOnSearch: false,
    loginRequired: false,
    resolve: {
      'collection': loadCollection,
      'metadata': loadMetadata
    }
  });

  $routeProvider.when('/collections/:collection_id/settings', {
    templateUrl: 'templates/collections_edit.html',
    controller: 'CollectionsEditCtrl',
    reloadOnSearch: false,
    loginRequired: false,
    resolve: {
      'collection': loadCollection,
      'metadata': loadMetadata,
      'roles': loadRoles
    }
  });

  $routeProvider.when('/entities', {
    templateUrl: 'templates/entity_index.html',
    controller: 'EntitiesIndexCtrl',
    reloadOnSearch: false,
    loginRequired: false,
    resolve: {
      'data': loadEntitiesIndex,
      'metadata': loadMetadata,
      'alerts': loadAlertsIndex
    }
  });

  $routeProvider.when('/crawlers', {
    templateUrl: 'templates/crawlers_manage.html',
    controller: 'CrawlersManageCtrl',
    reloadOnSearch: true,
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
      'statistics': loadHome,
      'metadata': loadMetadata
    }
  });

  $locationProvider.html5Mode(true);
  $compileProvider.debugInfoEnabled(false);
  cfpLoadingBarProvider.includeSpinner = false;
  cfpLoadingBarProvider.latencyThreshold = 100;

  uiSelectConfig.theme = 'bootstrap';
}]);
