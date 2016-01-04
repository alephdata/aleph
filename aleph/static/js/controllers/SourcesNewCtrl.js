
aleph.controller('SourcesNewCtrl', ['$scope', '$location', '$http', '$routeParams', 'Flash',
                                     'Validation', 'Metadata',
  function($scope, $location, $http, $routeParams, Flash, Validation, Metadata) {
  
  $scope.source = {
    fresh: true,
    'public': false
  };

  $scope.canSave = function() {
    return $scope.source.label;
  };

  $scope.save = function(form) {
      var res = $http.post('/api/1/sources', $scope.source);
      res.success(function(data) {
        Metadata.flush();
        Flash.message('The source has been created.', 'success');
        $location.path('/sources/' + data.id);
      });
      res.error(Validation.handle(form));
  };

}]);
