aleph.controller('AlertsManageCtrl', ['$scope', '$uibModalInstance', '$location', '$route', 'alerts', 'Alert',
    function($scope, $uibModalInstance, $location, $route, alerts, Alert) {

  $scope.alerts = alerts.results;

  $scope.openQuery = function(alert) {
    $location.path('/search');
    $location.search(alert.query);
    $uibModalInstance.close();
  };

  $scope.removeAlert = function(alert) {
    Alert.delete(alert.id).then(function() {
      $scope.alerts.splice($scope.alerts.indexOf(alert), 1)
    });
  };

  $scope.cancel = function() {
    $uibModalInstance.dismiss('cancel');
  };

  $scope.close = function(form) {
    $uibModalInstance.close();
    $route.reload();
  };

}]);
