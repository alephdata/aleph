
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
        $location.path('/');
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

  $scope.submitSearch = function() {
    $location.path('/search');
    $location.search($scope.query);
  }

  var ensureArray = function(data) {
    if (!angular.isArray(data)) {
      if (angular.isDefined(data) && data.length) {
        data = [data];
      } else {
        data = [];
      }
    }
    return data;
  };

  $scope.loadQuery = function() {
    $scope.query = $location.search();
    $scope.query.mode = $scope.query.mode || 'table';
    $scope.query.collection = ensureArray($scope.query.collection);
    $scope.query.entity = ensureArray($scope.query.entity);
  };

  $scope.loadQuery();

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
