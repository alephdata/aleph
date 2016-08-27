aleph.controller('CollectionsAnalysisCtrl', ['$scope', '$route', '$location', '$http', '$anchorScroll', 'Title', 'Entity', 'Authz', 'metadata', 'collection', 'paths',
    function($scope, $route, $location, $http, $anchorScroll, Title, Entity, Authz, metadata, collection, paths) {

  Title.set(collection.label, "collections");
  $scope.authz = Authz;
  $scope.collection = collection;
  $scope.paths = paths.data;
  $scope.collectionLabels = paths.collectionLabels;
  $scope.query = paths.query;
  $scope.metadata = metadata;

  $scope.viewPath = function(path) {
    $location.search({'node': path.nodes});
    $location.path('/collections/' + collection.id + '/networks');
  };

  $scope.editEntity = function(entity_id) {
    Entity.edit(entity_id);
  };

  $scope.loadOffset = function(offset) {
    $scope.query.set('offset', offset);
    $anchorScroll();
  };

}]);
