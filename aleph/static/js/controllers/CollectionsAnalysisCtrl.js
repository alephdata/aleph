aleph.controller('CollectionsAnalysisCtrl', ['$scope', '$route', '$location', '$http', 'Title', 'metadata', 'collection',
    function($scope, $route, $location, $http, Title, metadata, collection) {

  Title.set(collection.label, "collections");
  $scope.collection = collection;
  $scope.metadata = metadata;
  $scope.paths = [];

  var data = {'collection_id': collection.id};
  $http.post('/api/1/graph/paths', data).then(function(res) {
    $scope.paths = res.data.results;
  });

  $scope.viewPath = function(path) {
    var edges = path.edges.map(function(edge) { return edge.id });
    $location.search({'edge': edges});
    $location.path('/collections/' + collection.id + '/networks');
  };

}]);
