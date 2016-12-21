import aleph from '../aleph';

aleph.controller('SessionCtrl', ['$scope', '$location', '$uibModalInstance', '$httpParamSerializer', 'metadata',
    function($scope, $location, $uibModalInstance, $httpParamSerializer, metadata) {
  $scope.providers = metadata.session.providers;
  $scope.next_url = $httpParamSerializer({next: $location.url()});
}]);
