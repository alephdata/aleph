aleph.controller('SearchExportCtrl', ['$scope', '$http', 'result', 'fields',
  function($scope, $http, result, fields) {

  $scope.result = result;
  $scope.fields = fields;
  $scope.graph = {'limit': 75, 'options': [10, 75, 150, 300, 600, 1200]};

}]);
