aleph.controller('NetworksDeleteCtrl', ['$scope', '$location', '$q', '$http', '$uibModalInstance', 'Metadata', 'network',
    function($scope, $location, $q, $http, $uibModalInstance, Metadata, network) {
  
  $scope.blocked = false;
  $scope.network = network;

  $scope.cancel = function() {
    $uibModalInstance.dismiss('cancel');
  };

  $scope.confirm = function() {
    $scope.blocked = true;
    $http.delete(network.api_url).then(function(res) {
      $uibModalInstance.close();
    });
  };
}]);
