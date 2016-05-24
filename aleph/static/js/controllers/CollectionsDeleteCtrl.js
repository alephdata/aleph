aleph.controller('CollectionsDeleteCtrl', ['$scope', '$location', '$q', '$http', '$uibModalInstance', 'Metadata', 'collection',
    function($scope, $location, $q, $http, $uibModalInstance, Metadata, collection) {
  
  $scope.blocked = false;
  $scope.collection = collection;

  $scope.cancel = function() {
    $uibModalInstance.dismiss('cancel');
  };

  $scope.confirm = function() {
    $scope.blocked = true;
    $http.delete('/api/1/collections/' + collection.id).then(function(res) {
      Metadata.flush().then(function(res) {
        $uibModalInstance.close();  
      });
    });
  };

}]);
