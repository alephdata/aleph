aleph.controller('ListsEditCtrl', ['$scope', '$location', '$http', '$routeParams', '$uibModal',
                                   'Flash', 'Validation', 'QueryContext',
  function($scope, $location, $http, $routeParams, $uibModal, Flash, Validation, QueryContext) {
  
  var apiUrl = '/api/1/lists/' + $routeParams.id;
  $scope.list = {};
  $scope.users = {};

  $http.get(apiUrl).then(function(res) {
    $scope.list = res.data;
  })

  $http.get('/api/1/users').then(function(res) {
    $scope.users = res.data;
  })
  
  $scope.canSave = function() {
    return $scope.list.can_write;
  };

  $scope.hasUser = function(id) {
    var users = $scope.list.users || [];
    return users.indexOf(id) != -1;
  };

  $scope.toggleUser = function(id) {
    var idx = $scope.list.users.indexOf(id);
    if (idx != -1) {
      $scope.list.users.splice(idx, 1);
    } else {
      $scope.list.users.push(id);
    }
  };

  $scope.delete = function() {
    var d = $uibModal.open({
        templateUrl: 'lists_delete.html',
        controller: 'ListsDeleteCtrl',
        resolve: {
            list: function () { return $scope.list; }
        }
    });
  }

  $scope.save = function(form) {
    var res = $http.post(apiUrl, $scope.list);
    res.success(function(data) {
      QueryContext.reset();
      Flash.message('Your changes have been saved.', 'success');
    });
    res.error(Validation.handle(form));
  };

}]);
