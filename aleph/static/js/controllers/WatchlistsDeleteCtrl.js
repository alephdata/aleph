aleph.controller('WatchlistsDeleteCtrl', ['$scope', '$location', '$http', '$uibModalInstance', 'watchlist',
                                          'Flash', 'Metadata',
  function($scope, $location, $http, $uibModalInstance, watchlist, Flash, Metadata) {
  $scope.watchlist = watchlist;
  
  $scope.cancel = function() {
    $uibModalInstance.dismiss('cancel');
  };

  $scope.delete = function() {
    var res = $http.delete($scope.watchlist.api_url);
    res.then(function(data) {
        Metadata.flush();
        $location.path('/watchlists');
        $uibModalInstance.dismiss('ok');
    });
  };

}]);
