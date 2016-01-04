aleph.controller('AppCtrl', ['$scope', '$rootScope', '$location', '$route', '$http', '$uibModal', '$q',
                             'Flash', 'Session', 'Query', 'Metadata',
  function($scope, $rootScope, $location, $route, $http, $uibModal, $q, Flash, Session, Query, Metadata) {
  $scope.session = {logged_in: false};
  $scope.query = Query;
  $scope.flash = Flash;

  Metadata.get().then(function(context) {
    $scope.metadata = context;
    $scope.session = context.session;
  });

  $rootScope.$on("$routeChangeStart", function (event, next, current) {
    Session.get().then(function(session) {
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
    var d = $uibModal.open({
        templateUrl: 'profile.html',
        controller: 'ProfileCtrl',
        backdrop: true
    });
  };

  $scope.submitSearch = function(form) {
    $location.search($scope.query.state);
    $location.path('/search');
  };

  $scope.clearSearch = function(form) {
    Query.clear();
    $location.path('/search');
  };

}]);
