aleph.controller('CollectionsCreateCtrl', ['$scope', '$location', '$q', '$http', '$uibModalInstance', 'Collection', 'metadata',
    function($scope, $location, $q, $http, $uibModalInstance, Collection, metadata) {
  
  $scope.blocked = false;
  $scope.collection = {label: '', category: 'watchlist'};
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
    $http.post('/api/1/collections').then(function(coll) {
      Collection.flush().then(function(res) {
        $uibModalInstance.close(coll.data);  
      });
    });
  };

}]);
