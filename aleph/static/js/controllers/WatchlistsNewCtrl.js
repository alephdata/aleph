aleph.controller('WatchlistsNewCtrl', ['$scope', '$location', '$http', '$routeParams',
                                       'Validation', 'QueryContext',
  function($scope, $location, $http, $routeParams, Validation, QueryContext) {
  $scope.watchlist = {'public': false, 'new': true};
  
  $scope.canCreate = function() {
    return $scope.session.logged_in;
  };

  $scope.create = function(form) {
      var res = $http.post('/api/1/watchlists', $scope.watchlist);
      res.success(function(data) {
        QueryContext.reset();
        $location.path('/watchlists/' + data.id + '/entities');
      });
      res.error(Validation.handle(form));
  };

}]);
