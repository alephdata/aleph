aleph.controller('EntitiesDeleteCtrl', ['$scope', '$location', '$q', '$http', '$uibModalInstance', 'entities',
    function($scope, $location, $q, $http, $uibModalInstance, entities) {
  
  $scope.blocked = false;
  $scope.entities = entities;

  $scope.cancel = function() {
    $uibModalInstance.dismiss('cancel');
  };

  $scope.confirm = function() {
    $scope.blocked = true;
    var deletes = [];
    for (var i in entities) {
      var id = entities[i].id;
      deletes.push($http.delete('/api/1/entities/' + id));
    }
    $q.all(deletes).then(function() {
      $uibModalInstance.close(entities);
    }, function(err) {
      console.log('Delete error', err);
      $uibModalInstance.close(entities);
    });
  };

}]);
