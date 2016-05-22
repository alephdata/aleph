aleph.controller('EntitiesMergeCtrl', ['$scope', '$location', '$q', '$http', '$uibModalInstance', 'entities',
    function($scope, $location, $q, $http, $uibModalInstance, entities) {

  $scope.blocked = false;
  $scope.entities = entities.sort(function(a, b) {
    return (b.doc_count || 0) - (a.doc_count || 0);
  });
  $scope.select = {primary: $scope.entities[0].id};

  $scope.cancel = function() {
    $uibModalInstance.dismiss('cancel');
  };

  $scope.confirm = function() {
    $scope.blocked = true;
    var merges = [];
    for (var i in entities) {
      var id = entities[i].id;
      if (id != $scope.select.primary) {
        var url = '/api/1/entities/' +   $scope.select.primary + '/merge/' + id;
        merges.push($http.delete(url));  
      }
    }
    $q.all(merges).then(function() {
      $uibModalInstance.close($scope.select.primary);
    }, function(err) {
      console.log('Delete error', err);
      $uibModalInstance.close($scope.select.primary);
    });
  };

}]);
