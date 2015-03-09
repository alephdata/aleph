
aleph.controller('SearchExportCtrl', ['$scope', '$http', 'result', 'collections', 'attributes', 'Query',
  function($scope, $http, result, collections, attributes, Query) {

  $scope.result = result;
  $scope.collections = collections;
  $scope.query = Query;
  $scope.attributes = attributes;
  $scope.graph = {'limit': 75, 'options': [10, 75, 150, 300, 600, 1200]};

}]);






