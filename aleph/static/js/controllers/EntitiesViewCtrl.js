import aleph from '../aleph';

aleph.controller('EntitiesViewCtrl', ['$scope', '$route', '$location', '$anchorScroll', 'Authz', 'Title', 'Entity', 'Link', 'entity', 'links', 'similar', 'metadata',
    function($scope, $route, $location, $anchorScroll, Authz, Title, Entity, Link, entity, links, similar, metadata) {

  Title.set(entity.name, "entities");
  $scope.authz = Authz;
  $scope.metadata = metadata;
  $scope.entity = entity;
  $scope.links = links;
  $scope.similar = similar;

  $scope.showLinks = links.result.total || links.query.isFiltered();
  $scope.showLinksNav = links.result.total > links.result.limit || links.query.isFiltered();
  $scope.showSimilar = similar.result.total || similar.query.isFiltered();

  $scope.loadLinksOffset = function(offset) {
    $scope.links.query.set('offset', offset);
    $location.hash('links')
    $anchorScroll();
  };

  $scope.loadSimilarOffset = function(offset) {
    $scope.similar.query.set('offset', offset);
    $location.hash('similar')
    $anchorScroll();
  };

  $scope.searchLinks = function(form) {
    $scope.links.query.update();
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
    Entity.searchSimilar(entity.id).then(function(similar) {
      $scope.similar = similar;
    });
  });

}]);
