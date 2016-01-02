aleph.controller('ListsDeleteCtrl', ['$scope', '$location', '$http', '$uibModalInstance', 'list',
                                     'Flash', 'QueryContext',
  function($scope, $location, $http, $uibModalInstance, list, Flash, QueryContext) {
  $scope.list = list;
  
  $scope.cancel = function() {
    $uibModalInstance.dismiss('cancel');
  };

  $scope.delete = function() {
    var res = $http.delete($scope.list.api_url);
    res.then(function(data) {
        QueryContext.reset();
        $location.path('/lists');
        $uibModalInstance.dismiss('ok');
    });
  };

}]);
