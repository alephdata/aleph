aleph.controller('WatchlistsSelectCtrl', ['$scope', '$uibModalInstance', 'Metadata', 'watchlists',
    function($scope, $uibModalInstance, Metadata, watchlists) {

  Metadata.get().then(function(metadata) {
    var lists = [];
    for (var id in metadata.watchlists) {
      var wl = metadata.watchlists[id];
      wl.active = watchlists.indexOf(id + '') != -1;
      lists.push(wl);
    }
    $scope.watchlists = lists.sort(function(a, b) {
      return a.label.localeCompare(b.label);
    });
  });
  
  $scope.cancel = function() {
    $uibModalInstance.dismiss('cancel');
  };

  $scope.setAll = function(val) {
    for (var i in $scope.watchlists) {
      $scope.watchlists[i].active = val;
    }
  }

  $scope.update = function(form) {
    var active = [];
    for (var i in $scope.watchlists) {
      var wl = $scope.watchlists[i];
      if (wl.active) {
        active.push(wl.id + '');
      }
    }
    $uibModalInstance.close(active);
  };

}]);
