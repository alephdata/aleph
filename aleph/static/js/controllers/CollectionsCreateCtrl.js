aleph.controller('CollectionsCreateCtrl', ['$scope', '$location', '$q', '$http', '$uibModalInstance', 'Collection', 'metadata', 'collection',
    function($scope, $location, $q, $http, $uibModalInstance, Collection, metadata, collection) {
  
  $scope.blocked = false;
  $scope.collection = collection;
  $scope.categories = metadata.categories;

  $scope.cancel = function() {
    $uibModalInstance.dismiss('cancel');
  };

  $scope.canSave = function() {
    if ($scope.blocked) {
      return false;
    }
    return $scope.createCollection.$valid;
  };

  $scope.save = function() {
    if (!$scope.canSave()) {
      return;
    }
    $scope.blocked = true;
    $http.post('/api/1/collections', $scope.collection).then(function(coll) {
      Collection.flush().then(function(res) {
        $uibModalInstance.close(coll.data);
      });
    });
  };

}]);
