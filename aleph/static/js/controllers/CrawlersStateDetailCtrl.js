aleph.controller('CrawlersStateDetailCtrl', ['$scope', '$http', '$uibModalInstance', 'state',
    function($scope, $http, $uibModalInstance, state) {
  $scope.state = state;
  $scope.metaJson = JSON.stringify(state.meta, null, 2);

  $scope.close = function() {
    $uibModalInstance.dismiss('close');
  };

}]);
