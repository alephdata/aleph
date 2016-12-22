import aleph from '../aleph';

aleph.controller('EntitiesViewCtrl', ['$scope', '$route', '$location', '$anchorScroll', 'Authz', 'Title', 'Entity', 'Link', 'Document', 'entity', 'links', 'similar', 'documents', 'metadata',
    function($scope, $route, $location, $anchorScroll, Authz, Title, Entity, Link, Document, entity, links, similar, documents, metadata) {

  Title.set(entity.name, "entities");
  $scope.authz = Authz;
  $scope.metadata = metadata;
  $scope.entity = entity;
  $scope.links = links;
  $scope.documents = documents;
  $scope.similar = similar;

  $scope.showLinks = links.result.total || links.query.isFiltered();
  $scope.showLinksNav = links.result.total > links.result.limit || links.query.isFiltered();
  $scope.showDocuments = documents.result.total || documents.query.isFiltered();
  $scope.showDocumentsNav = documents.result.total > documents.result.limit || documents.query.isFiltered();
  $scope.showSimilar = similar.result.total || similar.query.isFiltered();

  $scope.loadLinksOffset = function(offset) {
    $scope.links.query.set('offset', offset);
    $location.hash('links')
    $anchorScroll();
  };

  $scope.loadDocumentsOffset = function(offset) {
    $scope.documents.query.set('offset', offset);
    $location.hash('documents')
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
    Link.search(entity.id, 'links_').then(function(links) {
      $scope.links = links;
    });
    Document.searchEntity(entity.id, 'documents_').then(function(documents) {
      $scope.documents = documents;
    });
    Entity.searchSimilar(entity.id, 'similar_').then(function(similar) {
      $scope.similar = similar;
    });
  });

}]);
