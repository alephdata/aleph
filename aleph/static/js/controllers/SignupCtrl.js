import aleph from '../aleph';

aleph.controller('SignupCtrl', ['$scope', '$location', '$routeParams', 'Role',
    function($scope, $location, $routeParams, Role) {

  $scope.role = {};
  $scope.role.code = $routeParams.code;
  $scope.showSuccess = false;

  $scope.register = function() {
    Role.create($scope.role).then(function(role) {
      $scope.showError = false;
      $scope.showSuccess = true;
    }, function(err) {
      $scope.showError = true;
      $scope.showSuccess = false;
    });
  };
}]);
