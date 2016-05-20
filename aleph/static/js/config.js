var aleph = angular.module('aleph', ['ngRoute', 'ngAnimate', 'ngSanitize', 'ui.bootstrap', 'pdf']);

aleph.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {

  $routeProvider.when('/search', {
    templateUrl: 'templates/search.html',
    controller: 'SearchCtrl',
    reloadOnSearch: true,
    loginRequired: false,
    resolve: {
      'data': loadSearch
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

  $routeProvider.when('/entities', {
    templateUrl: 'templates/entity_index.html',
    controller: 'EntitiesIndexCtrl',
    reloadOnSearch: true,
    loginRequired: false,
    resolve: {
      'data': loadEntitiesIndex
    }
  });

  $routeProvider.when('/entities/review', {
    templateUrl: 'templates/entity_review.html',
    controller: 'EntitiesReviewCtrl',
    reloadOnSearch: true,
    loginRequired: false,
    resolve: {}
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
      'data': loadHome
    }
  });

  $locationProvider.html5Mode(true);
}]);
