
aleph.controller('SearchExportCtrl', ['$scope', '$http', 'result', 'sources', 'attributes',
  function($scope, $http, result, sources, attributes) {

  $scope.result = result;
  $scope.sources = sources;
  $scope.attributes = attributes;
  $scope.graph = {'limit': 75, 'options': [10, 75, 150, 300, 600, 1200]};

}]);






