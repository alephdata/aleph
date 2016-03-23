aleph.controller('CollectionsSelectCtrl', ['$scope', '$uibModalInstance', 'Metadata', 'collections',
    function($scope, $uibModalInstance, Metadata, collections) {

  Metadata.get().then(function(metadata) {
    var cols = [];
    for (var id in metadata.collections) {
      var col = metadata.collections[id];
      col.active = collections.indexOf(id + '') != -1;
      cols.push(col);
    }
    $scope.collections = cols.sort(function(a, b) {
      return a.label.localeCompare(b.label);
    });
  });
  
  $scope.cancel = function() {
    $uibModalInstance.dismiss('cancel');
  };

  $scope.setAll = function(val) {
    for (var i in $scope.collections) {
      $scope.collections[i].active = val;
    }
  };

  $scope.update = function(form) {
    var active = [];
    for (var i in $scope.collections) {
      var col = $scope.collections[i];
      if (col.active) {
        active.push(col.id + '');
      }
    }
    $uibModalInstance.close(active);
  };

}]);
