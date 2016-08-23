aleph.controller('CollectionsAnalysisCtrl', ['$scope', '$route', '$location', '$http', '$anchorScroll', 'Title', 'metadata', 'collection', 'paths',
    function($scope, $route, $location, $http, $anchorScroll, Title, metadata, collection, paths) {

  Title.set(collection.label, "collections");
  $scope.collection = collection;
  $scope.paths = paths.data;
  $scope.query = paths.query;
  $scope.metadata = metadata;

  $scope.viewPath = function(path) {
    var edges = path.edges.map(function(edge) { return edge.id });
    $location.search({'edge': edges});
    $location.path('/collections/' + collection.id + '/networks');
  };

  $scope.loadOffset = function(offset) {
    $scope.query.set('offset', offset);
    $anchorScroll();
  };

}]);
