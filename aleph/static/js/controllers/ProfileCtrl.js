aleph.controller('ProfileCtrl', ['$scope', '$location', '$uibModalInstance', '$http', 'Session', 'Metadata',
  function($scope, $location, $uibModalInstance, $http, Session, Metadata) {
  $scope.user = {};
  $scope.session = {};

  Session.get().then(function(session) {
    $scope.user = session.user;
    $scope.session = session;
  });

  $scope.cancel = function() {
    $uibModalInstance.dismiss('cancel');
  };

  $scope.update = function(form) {
    var res = $http.post('/api/1/users/' + $scope.user.id, $scope.user);
    res.success(function(data) {
      $scope.user = data;
      $scope.session.user = data;
      Metadata.flush().then(function() {
        $uibModalInstance.dismiss('ok');
      });
    });
  };
}]);
