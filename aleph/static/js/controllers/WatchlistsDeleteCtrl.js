aleph.controller('WatchlistsDeleteCtrl', ['$scope', '$location', '$http', '$uibModalInstance', 'watchlist',
                                          'Flash', 'QueryContext',
  function($scope, $location, $http, $uibModalInstance, watchlist, Flash, QueryContext) {
  $scope.watchlist = watchlist;
  
  $scope.cancel = function() {
    $uibModalInstance.dismiss('cancel');
  };

  $scope.delete = function() {
    var res = $http.delete($scope.watchlist.api_url);
    res.then(function(data) {
        QueryContext.reset();
        $location.path('/watchlists');
        $uibModalInstance.dismiss('ok');
    });
  };

}]);
