
aleph.controller('AppCtrl', ['$scope', '$rootScope', '$location', '$route', '$http', '$modal', '$q',
                             'Flash', 'Session', 'Query', 'QueryContext',
  function($scope, $rootScope, $location, $route, $http, $modal, $q, Flash, Session, Query, QueryContext) {
  $scope.session = {logged_in: false};
  $scope.query = Query;
  $scope.flash = Flash;

  QueryContext.get().then(function(context) {
    $scope.queryContext = context;
  });

  Session.get(function(session) {
    $scope.session = session;
  });

  $rootScope.$on("$routeChangeStart", function (event, next, current) {
    Session.get(function(session) {
      if (next.$$route && next.$$route.loginRequired && !session.logged_in) {
        $location.search({});
        $location.path('/');
      }
    });
    $scope.query.state = Query.load();
  });

  $scope.suggestEntities = function(prefix) {
    var dfd = $q.defer();
    var opts = {params: {'prefix': prefix}, ignoreLoadingBar: true};
    $http.get('/api/1/entities/_suggest', opts).then(function(res) {
      dfd.resolve(res.data.results);
    });
    return dfd.promise;
  }

  $scope.acceptSuggestion = function($item) {
    $scope.query.state.q = '';
    Query.toggleFilter('entity', $item.id);
  }

  $scope.editProfile = function() {
    var d = $modal.open({
        templateUrl: 'profile.html',
        controller: 'ProfileCtrl',
        backdrop: true
    });
  };

  $scope.submitSearch = function(form) {
    $location.search($scope.query.state);
    if (Query.mode()) {
      $route.reload();
    } else {
      $location.path('/search');
    }
  };

  $scope.clearSearch = function(form) {
    var mode = Query.mode();
    Query.clear();
    if (mode == 'table') {
      $route.reload();
    } else {
      $location.path('/search');
    }
  };

}]);


aleph.controller('ProfileCtrl', ['$scope', '$location', '$modalInstance', '$http', 'Session',
  function($scope, $location, $modalInstance, $http, Session) {
  $scope.user = {};
  $scope.session = {};

  Session.get(function(session) {
    $scope.user = session.user;
    $scope.session = session;
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
  };  
}]);
