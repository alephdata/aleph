aleph.controller('CollectionsEditCtrl', ['$scope', '$location', '$http', '$routeParams', '$uibModalInstance',
                                         'Validation', 'Metadata', 'Collection', 'collection', 'roles',
    function($scope, $location, $http, $routeParams, $uibModalInstance, Validation, Metadata, Collection, collection, roles) {
  
  $scope.collection = collection;
  $scope.roles = roles.filter(function(r) {
    return r.type == 'user';
  });

  Metadata.get().then(function(metadata) {
    $scope.categories = metadata.categories;
  });

  $scope.cancel = function() {
    $uibModalInstance.dismiss('cancel');
  };

  $scope.delete = function() {
    Collection.delete(collection).then(function() {
      $uibModalInstance.dismiss('ok');
    });
  };
  
  $scope.process = function() {
    $http.post($scope.collecton.api_url + '/process').then(function() {
      $uibModalInstance.dismiss('ok');
    });
  };

  $scope.save = function(form) {
    var res = $http.post(collection.api_url, $scope.collection);
    res.success(function(data) {
      $scope.$on('permissionsSaved', function() {
        Collection.flush().then(function() {
          $uibModalInstance.close(data.data);
        });
      });
      $scope.$broadcast('savePermissions', data.data);
    });
    res.error(Validation.handle(form));
  };

}]);
