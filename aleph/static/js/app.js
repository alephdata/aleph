var aleph = angular.module('aleph', ['ngRoute', 'ngAnimate', 'ui.bootstrap', 'truncate']);

storyweb.config(['$routeProvider', '$locationProvider',
    function($routeProvider, $locationProvider) {

  //$routeProvider.when('/', {
  //  templateUrl: 'article_list.html',
  //  controller: 'ArticleListCtrl'
  //});

  $routeProvider.otherwise({
    redirectTo: '/'
  });

  $locationProvider.html5Mode(true);
}]);
