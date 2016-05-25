aleph.controller('SourcesEditCtrl', ['$scope', '$location', '$http', '$routeParams', '$uibModalInstance',
                                     'Validation', 'Metadata', 'metadata', 'source',
    function($scope, $location, $http, $routeParams, $uibModalInstance, Validation, Metadata, metadata, source) {
  
  $scope.source = source;
  $scope.processTriggered = false;
  $scope.categories = metadata.source_categories;

  $scope.canSave = function() {
    return $scope.source.can_write;
  };

  $scope.cancel = function() {
    $uibModalInstance.dismiss('cancel');
  };

  $scope.process = function() {
    if (!$scope.processTriggered) {
      $scope.processTriggered = true;
      $http.post($scope.source.api_url + '/process').then(function() {
        $uibModalInstance.dismiss('ok');
      });
    }
  };

  $scope.save = function(form) {
      var res = $http.post(source.api_url, $scope.source);
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
