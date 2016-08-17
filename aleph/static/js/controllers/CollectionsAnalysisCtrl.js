aleph.controller('CollectionsAnalysisCtrl', ['$scope', '$route', '$location', '$http', 'Scene', 'Title', 'metadata', 'collection',
    function($scope, $route, $location, $http, Scene, Title, metadata, collection) {

  Title.set(collection.label, "collections");
  $scope.collection = collection;
  $scope.metadata = metadata;
  $scope.paths = [];

  var data = {'collection_id': collection.id};
  $http.post('/api/1/graph/paths', data).then(function(res) {
    $scope.paths = res.data.results;
  });

}]);
