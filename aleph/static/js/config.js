var aleph = angular.module('aleph', ['ngRoute', 'ngAnimate', 'ngSanitize', 'ui.bootstrap',
                                     'pdf', 'angulartics', 'angulartics.piwik']);

aleph.config(['$routeProvider', '$locationProvider', '$analyticsProvider',
    function($routeProvider, $locationProvider, $analyticsProvider) {

  $routeProvider.when('/search', {
    templateUrl: 'search.html',
    controller: 'SearchCtrl',
    reloadOnSearch: true,
    loginRequired: false,
    resolve: {
      'data': loadSearch
    }
  });

  $routeProvider.when('/tabular/:document_id/:table_id', {
    templateUrl: 'tabular.html',
    controller: 'TabularCtrl',
    reloadOnSearch: true,
    loginRequired: false,
    resolve: {
      'data': loadTabular,
      'metadata': loadMetadata
    }
  });

  $routeProvider.when('/text/:document_id', {
    templateUrl: 'text.html',
    controller: 'TextCtrl',
    reloadOnSearch: false,
    loginRequired: false,
    resolve: {
      'data': loadText,
      'metadata': loadMetadata,
      'pages': loadPagesQuery
    }
  });

  $routeProvider.when('/', {
    templateUrl: 'home.html',
    controller: 'HomeCtrl',
    reloadOnSearch: false,
    loginRequired: false,
    resolve: {
      'data': loadHome
    }
  });

  $routeProvider.otherwise({
    redirectTo: '/',
    loginRequired: false
  });

  $locationProvider.html5Mode(false);
}]);
