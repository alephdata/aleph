aleph.controller('WatchlistsNewCtrl', ['$scope', '$location', '$http', '$routeParams',
                                       'Validation', 'Metadata',
  function($scope, $location, $http, $routeParams, Validation, Metadata) {
  $scope.watchlist = {'public': false, 'new': true};
  
  $scope.canCreate = function() {
    return $scope.session.logged_in;
  };

  $scope.create = function(form) {
      var res = $http.post('/api/1/watchlists', $scope.watchlist);
      res.success(function(data) {
        Metadata.flush();
        $location.path('/watchlists/' + data.id + '/entities');
      });
      res.error(Validation.handle(form));
  };

}]);
