
aleph.controller('SearchExportCtrl', ['$scope', '$http', 'result', 'attributes',
  function($scope, $http, result, attributes) {

  $scope.result = result;
  $scope.attributes = attributes;
  $scope.graph = {'limit': 75, 'options': [10, 75, 150, 300, 600, 1200]};

}]);






