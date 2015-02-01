

aleph.directive('collectionsFrame', ['$http', function($http) {
  return {
    restrict: 'E',
    transclude: true,
    scope: {
      'collection': '='
    },
    templateUrl: 'collections_frame.html',
    link: function (scope, element, attrs, model) {
      $http.get('/api/1/collections').then(function(res) {
        scope.collections = res.data;
      })
    }
  };
}]);


aleph.controller('CollectionsIndexCtrl', ['$scope', '$location', '$http',
  function($scope, $location, $http) {
  $scope.collections = {};

}]);


aleph.controller('CollectionsEditCtrl', ['$scope', '$location', '$http', '$routeParams',
  function($scope, $location, $http, $routeParams) {
  
  var apiUrl = '/api/1/collections/' + $routeParams.slug;
  $scope.collection = {};
  $scope.users = {};

  $http.get(apiUrl).then(function(res) {
    $scope.collection = res.data;
  })

  $http.get('/api/1/users').then(function(res) {
    $scope.users = res.data;
  })

  $scope.hasUser = function(id) {
    var users = $scope.collection.users || [];
    return users.indexOf(id) != -1;
  };

  $scope.toggleUser = function(id) {
    var idx = $scope.collection.users.indexOf(id);
    if (idx != -1) {
      $scope.collection.users.splice(idx, 1);
    } else {
      $scope.collection.users.push(id);
    }
    console.log($scope.collection);
  };

  $scope.save = function(form) {
      var res = $http.post(apiUrl, $scope.collection);
      res.success(function(data) {
          $location.path('/collections');
      });
      //res.error(grano.handleFormError(form));
  };

}]);
