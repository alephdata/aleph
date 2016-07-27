aleph.controller('CollectionsViewCtrl', ['$scope', '$location', '$http', '$anchorScroll', 'Title', 'Collection', 'Document', 'Entity', 'Authz', 'collection', 'metadata', 'data',
    function($scope, $location, $http, $anchorScroll, Title, Collection, Document, Entity, Authz, collection, metadata, data) {

  $scope.collection = collection;
  $scope.fields = metadata.fields;
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

  $scope.editEntity = function(entity, $event) {
    $event.stopPropagation();
    Entity.edit(entity.id).then(function() {
      $timeout(function() {
        reloadSearch();
      }, 100);
    });
  };

  var initFacets = function(query, result) {
    if (result.error) {
      return;
    }
    $scope.collectionFacet = query.sortFacet(result.facets.collections.values, 'filter:collection_id');
    $scope.entityFacet = query.sortFacet(result.facets.entities.values, 'entity');

    var queryFacets = query.getArray('facet'),
        facets = [];

    for (var name in metadata.fields) {
      var facet = {
        field: name,
        label: metadata.fields[name],
        active: queryFacets.indexOf(name) != -1
      };
      if (result.facets[name]) {
        var values = result.facets[name].values;
        facet.values = query.sortFacet(values, 'filter:' + name);  
      }
      facets.push(facet);
    }
    $scope.facets = facets;
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
    initFacets(data.query, data.result);
    $scope.result = data.result;
    $scope.query = data.query;
    // $scope.queryString = data.query.toString();
    $scope.originalText = data.query.state.q ? data.query.state.q : '';
    $scope.reportLoading(false);
  };

  updateSearch(data);
}]);
