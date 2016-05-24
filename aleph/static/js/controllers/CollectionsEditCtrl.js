aleph.controller('CollectionsEditCtrl', ['$scope', '$location', '$http', '$routeParams', '$uibModalInstance',
                                         'Validation', 'Metadata', 'Collection', 'collection',
    function($scope, $location, $http, $routeParams, $uibModalInstance, Validation, Metadata, Collection, collection) {
  
  $scope.collection = collection;

  $scope.cancel = function() {
    $uibModalInstance.dismiss('cancel');
  };

  $scope.delete = function() {
    Collection.delete(collection).then(function() {
      $uibModalInstance.dismiss('cancel');
    });
  };

  $scope.save = function(form) {
    var res = $http.post(collection.api_url, $scope.collection);
    res.success(function(data) {
      $scope.$on('permissionsSaved', function() {
        Metadata.flush().then(function() {
          $uibModalInstance.close(data.data);
        });
      });
      $scope.$broadcast('savePermissions', data.data);
    });
    res.error(Validation.handle(form));
  };

}]);
