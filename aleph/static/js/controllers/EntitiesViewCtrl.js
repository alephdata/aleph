aleph.controller('EntitiesViewCtrl', ['$scope', '$route', 'Authz', 'Title', 'Entity', 'entity', 'links', 'metadata',
    function($scope, $route, Authz, Title, Entity, entity, links, metadata) {

  $scope.authz = Authz;
  $scope.metadata = metadata;
  $scope.entity = entity;

  $scope.links = links;

  Title.set(entity.name, "entities");

  $scope.loadLinksOffset = function(offset) {
    $scope.query.set('links_offset', offset);
    // $anchorScroll();
  };

  $scope.edit = function() {
    Entity.edit($scope.entity.id).then(function() {
      $route.reload();
    });
  };

}]);
