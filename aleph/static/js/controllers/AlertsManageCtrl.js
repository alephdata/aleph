import aleph from '../aleph';

aleph.controller('AlertsManageCtrl', ['$scope', '$uibModalInstance', '$location', '$route', 'alerts', 'Alert',
    function($scope, $uibModalInstance, $location, $route, alerts, Alert) {

  $scope.alerts = alerts.results;

  $scope.openQuery = function(alert) {
    $location.path('/documents');
    $location.search({'q': alert.query_text, 'entity': alert.entity_id});
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
