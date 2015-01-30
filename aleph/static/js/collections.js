aleph.controller('CollectionsIndexCtrl', ['$scope', '$location', '$http',
  function($scope, $location, $http) {
  $scope.collections = {};

  $http.get('/api/1/collections').then(function(res) {
    $scope.collections = res.data;
  })

}]);

aleph.controller('CollectionsEditCtrl', ['$scope', '$location', '$http', '$modalInstance', 'slug',
  function($scope, $location, $http, $modalInstance, slug) {
  
  var apiUrl = '/api/1/collections/' + slug;
  $scope.collection = {};
  $scope.users = {};

  $http.get(apiUrl).then(function(res) {
    $scope.collection = res.data;
  })

  $http.get('/api/1/users').then(function(res) {
    $scope.users = res.data;
  })

  $scope.hasUser = function(id) {
    return $scope.collection.users.indexOf(id) != -1;
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

  $scope.cancel = function() {
      $modalInstance.dismiss('cancel');
  };

  $scope.update = function(form) {
      var res = $http.post(apiUrl, $scope.collection);
      res.success(function(data) {
          $modalInstance.dismiss('ok');
      });
      //res.error(grano.handleFormError(form));
  };

}]);
