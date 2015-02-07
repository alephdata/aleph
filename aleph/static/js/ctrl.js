
aleph.controller('AppCtrl', ['$scope', '$rootScope', '$location', '$http', '$modal', '$q', 'Session', 'Query',
  function($scope, $rootScope, $location, $http, $modal, $q, Session, Query) {
  $scope.session = {logged_in: false};
  $scope.query = Query.state;

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

  $scope.editCollection = function(slug) {
    var d = $modal.open({
        templateUrl: 'collections_edit.html',
        controller: 'CollectionsEditCtrl',
        backdrop: true,
        size: 'lg',
        resolve: {
          slug: function () {
            return slug;
          }
        }
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
        //res.error(grano.handleFormError(form));
    };  
}]);
