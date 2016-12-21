import aleph from '../aleph';

aleph.controller('CollectionsDocumentsCtrl', ['$scope', '$location', '$http', '$route', '$anchorScroll', 'Title', 'Collection', 'Document', 'Authz', 'collection', 'metadata', 'data',
    function($scope, $location, $http, $route, $anchorScroll, Title, Collection, Document, Authz, collection, metadata, data) {

  $scope.collection = collection;
  $scope.metadata = metadata;
  $scope.getDocumentUrl = Document.getUrl;
  $scope.entityFacet = [];
  $scope.facets = [];
  $scope.authz = Authz;
  $scope.sortOptions = {
    score: 'Relevancy',
    newest: 'Newest',
    oldest: 'Oldest'
  };
  Title.set(collection.label, "collections");

  $scope.loadOffset = function(offset) {
    $scope.query.set('offset', offset);
    $anchorScroll();
  };

  $scope.editDocument = function(doc) {
    Document.edit(doc.id).then(function() {
      $route.reload();
    })
  };

  $scope.isEmpty = function() {
    return !$scope.query.isFiltered() && $scope.result.limit > 0 && $scope.result.total == 0;
  };

  $scope.$on('$routeUpdate', function() {
    reloadSearch();
  });

  var reloadSearch = function() {
    $scope.reportLoading(true);
    Document.search(collection.id).then(function(data) {
      updateSearch(data);
    });
  };

  var updateSearch = function(data) {
    $scope.query = data.query;
    $scope.result = data.result;
    $scope.reportLoading(false);
  };

  updateSearch(data);
}]);
