aleph.controller('SessionCtrl', ['$scope', '$uibModalInstance', 'metadata',
    function($scope, $uibModalInstance, metadata) {
  $scope.providers = metadata.session.providers;

}]);
