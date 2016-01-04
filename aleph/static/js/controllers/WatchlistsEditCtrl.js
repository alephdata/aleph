aleph.controller('WatchlistsEditCtrl', ['$scope', '$location', '$http', '$routeParams', '$uibModal',
                                        'Flash', 'Validation', 'QueryContext',
  function($scope, $location, $http, $routeParams, $uibModal, Flash, Validation, QueryContext) {
  
  var apiUrl = '/api/1/watchlists/' + $routeParams.id;
  $scope.watchlist = {};
  $scope.users = {};

  $http.get(apiUrl).then(function(res) {
    $scope.watchlist = res.data;
  })

  $http.get('/api/1/users').then(function(res) {
    $scope.users = res.data;
  })
  
  $scope.canSave = function() {
    return $scope.watchlist.can_write;
  };

  $scope.hasUser = function(id) {
    var users = $scope.watchlist.users || [];
    return users.indexOf(id) != -1;
  };

  $scope.toggleUser = function(id) {
    var idx = $scope.watchlist.users.indexOf(id);
    if (idx != -1) {
      $scope.watchlist.users.splice(idx, 1);
    } else {
      $scope.watchlist.users.push(id);
    }
  };

  $scope.delete = function() {
    var d = $uibModal.open({
        templateUrl: 'watchlists_delete.html',
        controller: 'WatchlistsDeleteCtrl',
        resolve: {
            watchlist: function () { return $scope.watchlist; }
        }
    });
  }

  $scope.save = function(form) {
    var res = $http.post(apiUrl, $scope.watchlist);
    res.success(function(data) {
      QueryContext.reset();
      Flash.message('Your changes have been saved.', 'success');
    });
    res.error(Validation.handle(form));
  };

}]);
