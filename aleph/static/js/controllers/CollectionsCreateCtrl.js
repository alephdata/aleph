import aleph from '../aleph';

aleph.controller('CollectionsCreateCtrl', ['$scope', '$location', '$q', '$http', '$uibModalInstance', 'Metadata', 'metadata', 'collection',
    function($scope, $location, $q, $http, $uibModalInstance, Metadata, metadata, collection) {

  $scope.blocked = false;
  $scope.collection = collection;
  $scope.metadata = metadata;
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
      Metadata.flush().then(function() {
        $uibModalInstance.close(coll.data);
      });
    });
  };
}]);
