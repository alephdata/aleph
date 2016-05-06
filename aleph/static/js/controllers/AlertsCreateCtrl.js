aleph.controller('AlertsCreateCtrl', ['$scope', '$http', '$uibModalInstance', '$location', '$route', 'alert',
    function($scope, $http, $uibModalInstance, $location, $route, alert) {

  $scope.alert = alert;

  $scope.cancel = function() {
    $uibModalInstance.dismiss('cancel');
  };

  $scope.save = function() {
    $http.post('/api/1/alerts', $scope.alert).then(function(res) {
      $uibModalInstance.close(res.data);
    });
  };

}]);
