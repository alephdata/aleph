
aleph.directive('listsFrame', ['$http', function($http) {
  return {
    restrict: 'E',
    transclude: true,
    scope: {
      'list': '=',
      'selected': '@'
    },
    templateUrl: 'lists_frame.html',
    link: function (scope, element, attrs, model) {
      $http.get('/api/1/lists').then(function(res) {
        scope.lists = res.data;
      })
    }
  };
}]);


aleph.controller('ListsEditCtrl', ['$scope', '$location', '$http', '$routeParams', '$modal',
                                   'Flash', 'Validation', 'QueryContext',
  function($scope, $location, $http, $routeParams, $modal, Flash, Validation, QueryContext) {
  
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
    var d = $modal.open({
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


aleph.controller('ListsNewCtrl', ['$scope', '$location', '$http', '$routeParams',
                                  'Validation', 'QueryContext',
  function($scope, $location, $http, $routeParams, Validation, QueryContext) {
  $scope.list = {'public': false, 'new': true};
  
  $scope.canCreate = function() {
    return $scope.session.logged_in;
  };

  $scope.create = function(form) {
      var res = $http.post('/api/1/lists', $scope.list);
      res.success(function(data) {
        QueryContext.reset();
        $location.path('/lists/' + data.id + '/entities');
      });
      res.error(Validation.handle(form));
  };

}]);


aleph.controller('ListsDeleteCtrl', ['$scope', '$location', '$http', '$modalInstance', 'list',
                                     'Flash', 'QueryContext',
  function($scope, $location, $http, $modalInstance, list, Flash, QueryContext) {
  $scope.list = list;
  
  $scope.cancel = function() {
    $modalInstance.dismiss('cancel');
  };

  $scope.delete = function() {
    var res = $http.delete($scope.list.api_url);
    res.then(function(data) {
        QueryContext.reset();
        $location.path('/lists');
        $modalInstance.dismiss('ok');
    });
  };

}]);
