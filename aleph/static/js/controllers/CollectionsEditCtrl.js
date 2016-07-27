aleph.controller('CollectionsEditCtrl', ['$scope', '$location', '$http', '$routeParams', '$uibModalInstance',
                                         'Validation', 'Collection', 'collection', 'roles', 'metadata',
    function($scope, $location, $http, $routeParams, $uibModalInstance, Validation, Collection, collection, roles, metadata) {
  
  $scope.collection = collection;
  $scope.roles = roles.filter(function(r) {
    return r.type == 'user';
  });
  $scope.categories = metadata.categories;

  $scope.cancel = function() {
    $uibModalInstance.dismiss('cancel');
  };

  $scope.delete = function() {
    Collection.delete(collection).then(function() {
      $uibModalInstance.dismiss('ok');
    });
  };
  
  $scope.process = function() {
    var url ='/api/1/collections/' + $scope.collection.id + '/process';
    $http.post(url).then(function() {
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
