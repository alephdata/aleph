
aleph.controller('AppCtrl', ['$scope', '$rootScope', '$location', '$http', '$modal', '$q',
                             'ngProgressLite', 'Flash', 'Session', 'Query',
  function($scope, $rootScope, $location, $http, $modal, $q, ngProgressLite, Flash, Session, Query) {
  $scope.session = {logged_in: false};
  $scope.query = Query.state;
  $scope.flash = Flash;

  Session.get(function(session) {
    $scope.session = session;
  });

  $rootScope.$on("$routeChangeStart", function (event, next, current) {
    if (next.$$route && next.$$route.progressBar) {
      ngProgressLite.start();
    }

    Session.get(function(session) {
      if (next.$$route && next.$$route.loginRequired && !session.logged_in) {
        $location.search({});
        $location.path('/');
      }
    });
  });

  $rootScope.$on("$routeChangeSuccess", function (event, next, current) {
    ngProgressLite.done();
  });

  $rootScope.$on("routeChangeError", function (event, next, current) {
    ngProgressLite.done();
  });

  $scope.suggestEntities = function(prefix) {
    var dfd = $q.defer();
    $http.get('/api/1/entities/_suggest', {params: {'prefix': prefix}}).then(function(res) {
      dfd.resolve(res.data.results);
    });
    return dfd.promise;
  }

  $scope.acceptSuggestion = function($item) {
    $scope.query.q = '';
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
    $location.search(Query.state);
    $location.path('/search');
  };

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
    };  
}]);
