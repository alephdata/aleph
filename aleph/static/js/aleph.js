var aleph = angular.module('aleph', ['ngRoute', 'ngAnimate', 'ngSanitize', 'ui.bootstrap',
                                     'ui.select', 'angular-loading-bar', 'ngFileUpload',
                                     'truncate', 'pdf']);

aleph.config(['$routeProvider', '$locationProvider', '$compileProvider', 'cfpLoadingBarProvider', 'uiSelectConfig',
    function($routeProvider, $locationProvider, $compileProvider, cfpLoadingBarProvider, uiSelectConfig) {

  $routeProvider.when('/search', {
    templateUrl: 'templates/documents/search.html',
    controller: 'SearchCtrl',
    reloadOnSearch: false,
    resolve: {
      'data': loadSearch,
      'peek': loadPeek,
      'metadata': loadMetadata,
      'alerts': loadAlertsIndex
    }
  });

  $routeProvider.when('/tabular/:document_id/:table_id', {
    templateUrl: 'templates/documents/tabular.html',
    controller: 'TabularCtrl',
    reloadOnSearch: true,
    resolve: {
      'data': loadTabular,
      'metadata': loadMetadata
    }
  });

  $routeProvider.when('/text/:document_id', {
    templateUrl: 'templates/documents/text.html',
    controller: 'TextCtrl',
    reloadOnSearch: false,
    resolve: {
      'data': loadText,
      'metadata': loadMetadata,
      'pages': loadPagesQuery
    }
  });

  $routeProvider.when('/collections', {
    templateUrl: 'templates/collections/index.html',
    controller: 'CollectionsIndexCtrl',
    reloadOnSearch: true,
    resolve: {
      'collections': loadCollections,
      'metadata': loadMetadata
    }
  });

  $routeProvider.when('/collections/:collection_id', {
    templateUrl: 'templates/collections/documents.html',
    controller: 'CollectionsDocumentsCtrl',
    reloadOnSearch: false,
    resolve: {
      'collection': loadCollection,
      'data': loadCollectionDocuments,
      'metadata': loadMetadata
    }
  });

  $routeProvider.when('/collections/:collection_id/entities', {
    templateUrl: 'templates/collections/entities.html',
    controller: 'CollectionsEntitiesCtrl',
    reloadOnSearch: false,
    resolve: {
      'collection': loadCollection,
      'data': loadCollectionEntities,
      'metadata': loadMetadata,
      'alerts': loadAlertsIndex
    }
  });

  $routeProvider.when('/collections/:collection_id/entities/review', {
    templateUrl: 'templates/entities/review.html',
    controller: 'EntitiesReviewCtrl',
    reloadOnSearch: false,
    resolve: {
      'collection': loadCollection,
      'metadata': loadMetadata
    }
  });

  $routeProvider.when('/collections/:collection_id/entities/bulk', {
    templateUrl: 'templates/entities/bulk.html',
    controller: 'EntitiesBulkCtrl',
    reloadOnSearch: false,
    resolve: {
      'collection': loadCollection,
      'metadata': loadMetadata
    }
  });

  $routeProvider.when('/collections/:collection_id/settings', {
    templateUrl: 'templates/collections/edit.html',
    controller: 'CollectionsEditCtrl',
    reloadOnSearch: false,
    resolve: {
      'collection': loadCollection,
      'metadata': loadMetadata,
      'roles': loadRoles
    }
  });

  $routeProvider.when('/collections/:collection_id/analysis', {
    templateUrl: 'templates/collections/analysis.html',
    controller: 'CollectionsAnalysisCtrl',
    reloadOnSearch: true,
    resolve: {
      'collection': loadCollection,
      'metadata': loadMetadata,
      'paths': loadPaths
    }
  });

  $routeProvider.when('/collections/:collection_id/states', {
    templateUrl: 'templates/collections/states.html',
    controller: 'CollectionsCrawlersStatesCtrl',
    reloadOnSearch: true,
    resolve: {
      'collection': loadCollection,
      'metadata': loadMetadata,
      'states': loadCrawlerStates
    }
  });

  $routeProvider.when('/collections/:collection_id/networks', {
    templateUrl: 'templates/collections/networks.html',
    controller: 'CollectionsNetworksCtrl',
    reloadOnSearch: false,
    resolve: {
      'collection': loadCollection,
      'metadata': loadMetadata,
      'networks': loadNetworks
    }
  });

  $routeProvider.when('/collections/:collection_id/networks/new', {
    templateUrl: 'templates/networks/create.html',
    controller: 'NetworksCreateCtrl',
    reloadOnSearch: false,
    resolve: {
      'collection': loadCollection,
      'metadata': loadMetadata,
      'network': loadNetworkFromQuery
    }
  });

  $routeProvider.when('/collections/:collection_id/networks/:network_id', {
    templateUrl: 'templates/networks/edit.html',
    controller: 'NetworksEditCtrl',
    reloadOnSearch: false,
    resolve: {
      'collection': loadCollection,
      'metadata': loadMetadata,
      'network': loadNetwork
    }
  });

  $routeProvider.when('/crawlers', {
    templateUrl: 'templates/crawlers/manage.html',
    controller: 'CrawlersManageCtrl',
    reloadOnSearch: true,
    resolve: {
      'crawlers': loadCrawlers
    }
  });

  $routeProvider.when('/help/:page', {
    templateUrl: 'templates/help.html',
    controller: 'HelpCtrl',
    reloadOnSearch: false,
    resolve: {}
  });

  $routeProvider.when('/help', {
    templateUrl: 'templates/help.html',
    controller: 'HelpCtrl',
    reloadOnSearch: false,
    resolve: {}
  });

  $routeProvider.when('/', {
    templateUrl: 'templates/home.html',
    controller: 'HomeCtrl',
    reloadOnSearch: false,
    resolve: {
      'statistics': loadStatistics,
      'facets': loadCollectionFacets,
      'collections': loadUserCollections,
      'metadata': loadMetadata
    }
  });

  $locationProvider.html5Mode(true);
  $compileProvider.debugInfoEnabled(false);
  cfpLoadingBarProvider.includeSpinner = false;
  cfpLoadingBarProvider.latencyThreshold = 200;

  uiSelectConfig.theme = 'bootstrap';
}]);
