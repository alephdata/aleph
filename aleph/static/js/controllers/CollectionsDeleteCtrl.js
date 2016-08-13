aleph.controller('CollectionsDeleteCtrl', ['$scope', '$location', '$q', '$http', '$uibModalInstance', 'Collection', 'collection',
    function($scope, $location, $q, $http, $uibModalInstance, Collection, collection) {
  
  $scope.blocked = false;
  $scope.collection = collection;

  $scope.cancel = function() {
    $uibModalInstance.dismiss('cancel');
  };

  $scope.confirm = function() {
    $scope.blocked = true;
    $http.delete(collection.api_url).then(function(res) {
      Collection.flush().then(function(res) {
        $uibModalInstance.close();
      });
    });
  };
}]);
