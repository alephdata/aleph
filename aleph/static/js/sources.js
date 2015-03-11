

aleph.directive('sourcesFrame', ['$http', function($http) {
  return {
    restrict: 'E',
    transclude: true,
    scope: {
      'source': '='
    },
    templateUrl: 'sources_frame.html',
    link: function (scope, element, attrs, model) {
      $http.get('/api/1/sources').then(function(res) {
        scope.sources = res.data;
      })
    }
  };
}]);


aleph.controller('SourcesIndexCtrl', ['$scope', '$location', '$http',
  function($scope, $location, $http) {
  $scope.sources = {};

}]);


aleph.controller('SourcesEditCtrl', ['$scope', '$location', '$http', '$routeParams', 'Flash',
                                     'Validation', 'QueryContext',
  function($scope, $location, $http, $routeParams, Flash, Validation, QueryContext) {
  
  var apiUrl = '/api/1/sources/' + $routeParams.slug;
  $scope.source = {};
  $scope.users = {};

  $http.get(apiUrl).then(function(res) {
    $scope.source = res.data;
  })

  $http.get('/api/1/users').then(function(res) {
    $scope.users = res.data;
  })

  $scope.canSave = function() {
    return $scope.source.can_write;
  };

  $scope.hasUser = function(id) {
    var users = $scope.source.users || [];
    return users.indexOf(id) != -1;
  };

  $scope.toggleUser = function(id) {
    var idx = $scope.source.users.indexOf(id);
    if (idx != -1) {
      $scope.source.users.splice(idx, 1);
    } else {
      $scope.source.users.push(id);
    }
  };

  $scope.save = function(form) {
      var res = $http.post(apiUrl, $scope.source);
      res.success(function(data) {
        QueryContext.reset();
        Flash.message('Your changes have been saved.', 'success');
      });
      res.error(Validation.handle(form));
  };

}]);
