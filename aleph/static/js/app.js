var aleph = angular.module('aleph', ['ngRoute', 'ngAnimate', 'ui.bootstrap', 'truncate', 'infinite-scroll']);

aleph.config(['$routeProvider', '$locationProvider',
    function($routeProvider, $locationProvider) {

  $routeProvider.when('/search', {
    templateUrl: 'search.html',
    controller: 'SearchCtrl',
    loginRequired: true
  });

  $routeProvider.when('/login', {
    templateUrl: 'login.html',
    controller: 'LoginCtrl',
    loginRequired: false
  });

  $routeProvider.otherwise({
    redirectTo: '/search',
    loginRequired: false
  });

  $locationProvider.html5Mode(true);
}]);


aleph.factory('Session', ['$http', '$q', function($http, $q) {
    var dfd = null;

    var reset = function() {
        dfd = null;
    };

    var get = function(cb) {
        if (dfd === null) {
            var dt = new Date();
            var config = {cache: false, params: {'_': dt.getTime()}};
            dfd = $http.get('/api/1/sessions', config);
        }
        dfd.success(cb);
    };

    return {
        get: get,
        reset: reset
    };
}]);


aleph.controller('AppCtrl', ['$scope', '$rootScope', '$location', '$http', '$modal', 'Session',
  function($scope, $rootScope, $location, $http, $modal, Session) {
  $scope.session = {logged_in: false};
  $scope.query = {};

  Session.get(function(session) {
    $scope.session = session;
  });

  $rootScope.$on("$routeChangeStart", function (event, next, current) {
    Session.get(function(session) {
      if (next.$$route && next.$$route.loginRequired && !session.logged_in) {
        $location.search({});
        $location.path('/login');
      }
    });
  });

  $scope.editProfile = function() {
    var d = $modal.open({
        templateUrl: 'profile.html',
        controller: 'ProfileCtrl',
        backdrop: true
    });
  };

  $scope.submitSearch = function() {
    $location.path('/search');
    $location.search($scope.query);
  }

  $scope.loadQuery = function() {
    $scope.query = $location.search();
  };

  $scope.loadQuery();

}]);


aleph.controller('SearchCtrl', ['$scope', '$location', '$http',
  function($scope, $location, $http) {

  var isLoading = false;
  $scope.result = {};
  
  $scope.load = function() {
    $scope.loadQuery();
    var query = angular.copy($scope.query);
    query['limit'] = 35;
    isLoading = true;
    $http.get('/api/1/query', {params: query}).then(function(res) {
      $scope.result = res.data;
      isLoading = false;
    });
  };

  $scope.hasMore = function() {
    return !isLoading && $scope.result.next_url !== null;
  }

  $scope.loadMore = function() {
    isLoading = true;
    $http.get($scope.result.next_url).then(function(res) {
      //console.log("beeen called.");
      $scope.result.results = $scope.result.results.concat(res.data.results);
      $scope.result.next_url = res.data.next_url;
      isLoading = false;
    });
  }

  $scope.load();
}]);


aleph.controller('LoginCtrl', ['$scope', '$location', '$http',
  function($scope, $location, $http) {

}]);


aleph.controller('ProfileCtrl', ['$scope', '$location', '$modalInstance', '$http', 'Session',
  function($scope, $location, $modalInstance, $http, Session) {
    $scope.session = {logged_in: false};
    $scope.user = {};

    Session.get(function(session) {
        $scope.session = session;
        $scope.user = session.user;
    });

    $scope.cancel = function() {
        $modalInstance.dismiss('cancel');
    };

    $scope.update = function(form) {
        var res = $http.post('/api/1/users/' + $scope.user.id, $scope.user);
        res.success(function(data) {
            $scope.user = data;
            $scope.session.user = data;
            $modalInstance.dismiss('ok');
        });
        //res.error(grano.handleFormError(form));
    };  
}]);
