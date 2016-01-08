aleph.controller('ProfileCtrl', ['$scope', '$location', '$uibModalInstance', '$http', 'Session', 'Metadata',
  function($scope, $location, $uibModalInstance, $http, Session, Metadata) {
  $scope.role = {};
  $scope.session = {};

  Session.get().then(function(session) {
    $scope.role = session.role;
    $scope.session = session;
  });

  $scope.cancel = function() {
    $uibModalInstance.dismiss('cancel');
  };

  $scope.update = function(form) {
    var res = $http.post('/api/1/roles/' + $scope.role.id, $scope.role);
    res.success(function(data) {
      $scope.role = data;
      $scope.session.role = data;
      Metadata.flush().then(function() {
        $uibModalInstance.close($scope.role);
      });
    });
  };
}]);
