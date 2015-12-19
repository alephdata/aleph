
aleph.controller('SourcesNewCtrl', ['$scope', '$location', '$http', '$routeParams', 'Flash',
                                     'Validation', 'QueryContext', 'crawlers',
  function($scope, $location, $http, $routeParams, Flash, Validation, QueryContext, crawlers) {
  
  $scope.source = {
    config: {},
    fresh: true,
    'public': false,
    crawler: crawlers.results[0].name
  };
  $scope.crawlers = crawlers;
  $scope.slugGen = true;

  $scope.canSave = function() {
    return $scope.source.label && $scope.source.slug;
  };

  $scope.stopSlug = function() {
    $scope.slugGen = false;
  };

  $scope.$watch('source.label', function(l) {
    if($scope.slugGen) {
      var slug = l.toLowerCase()
        .replace(/ /g,'-')
        .replace(/[^\w-]+/g,'')
      $scope.source.slug = slug;
    }
  });

  $scope.save = function(form) {
      var res = $http.post('/api/1/sources', $scope.source);
      res.success(function(data) {
        QueryContext.reset();
        Flash.message('The source has been created.', 'success');
        $location.path('/sources/' + data.slug);
      });
      res.error(Validation.handle(form));
  };

}]);
