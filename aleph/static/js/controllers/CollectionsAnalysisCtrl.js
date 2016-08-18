aleph.controller('CollectionsAnalysisCtrl', ['$scope', '$route', '$location', '$http', 'Title', 'metadata', 'collection', 'analysis',
    function($scope, $route, $location, $http, Title, metadata, collection, analysis) {

  Title.set(collection.label, "collections");
  $scope.collection = collection;
  $scope.analysis = analysis;
  $scope.query = analysis.query;
  $scope.metadata = metadata;

  $scope.viewPath = function(path) {
    var edges = path.edges.map(function(edge) { return edge.id });
    $location.search({'edge': edges});
    $location.path('/collections/' + collection.id + '/networks');
  };

}]);
