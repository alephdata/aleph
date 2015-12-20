
aleph.controller('SourcesNewCtrl', ['$scope', '$location', '$http', '$routeParams', 'Flash',
                                     'Validation', 'QueryContext',
  function($scope, $location, $http, $routeParams, Flash, Validation, QueryContext) {
  
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
        QueryContext.reset();
        Flash.message('The source has been created.', 'success');
        $location.path('/sources/' + data.id);
      });
      res.error(Validation.handle(form));
  };

}]);
