aleph.controller('EntitiesViewCtrl', ['$scope', '$route', '$location', '$anchorScroll', 'Authz', 'Title', 'Entity', 'Link', 'entity', 'links', 'metadata',
    function($scope, $route, $location, $anchorScroll, Authz, Title, Entity, Link, entity, links, metadata) {

  Title.set(entity.name, "entities");
  $scope.authz = Authz;
  $scope.metadata = metadata;
  $scope.entity = entity;
  $scope.links = links;

  $scope.loadLinksOffset = function(offset) {
    $scope.links.query.set('offset', offset);
    $location.hash('links')
    $anchorScroll();
  };

  $scope.edit = function() {
    Entity.edit($scope.entity.id).then(function() {
      $route.reload();
    });
  };

  $scope.$on('$routeUpdate', function() {
    Link.search(entity.id).then(function(links) {
      $scope.links = links;
    });
  });

}]);
