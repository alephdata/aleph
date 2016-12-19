import aleph from '../aleph';

aleph.controller('ProfileCtrl', ['$scope', '$location', '$uibModalInstance', '$http', 'Role', 'metadata',
    function($scope, $location, $uibModalInstance, $http, Role, metadata) {
  $scope.role = metadata.session.role;
  $scope.session = metadata.session;

  $scope.cancel = function() {
    $uibModalInstance.dismiss('cancel');
  };

  $scope.update = function(form) {
    Role.save($scope.role).then(function(role) {
      $uibModalInstance.close(role);
    }, function(err) {
      console.log('Error', err);
    });
  };
}]);
