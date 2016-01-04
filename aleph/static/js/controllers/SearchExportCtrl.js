aleph.controller('SearchExportCtrl', ['$scope', '$http', 'result', 'metadata',
  function($scope, $http, result, metadata) {

  $scope.result = result;
  $scope.metadata = metadata;
  $scope.graph = {'limit': 75, 'options': [10, 75, 150, 300, 600, 1200]};

}]);
