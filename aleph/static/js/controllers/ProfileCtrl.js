aleph.controller('ProfileCtrl', ['$scope', '$location', '$uibModalInstance', '$http', 'Session',
  function($scope, $location, $uibModalInstance, $http, Session) {
  $scope.user = {};
  $scope.session = {};

  Session.get(function(session) {
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
      $uibModalInstance.dismiss('ok');
    });
  };
}]);
