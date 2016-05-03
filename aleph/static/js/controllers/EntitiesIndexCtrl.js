
aleph.controller('EntitiesIndexCtrl', ['$scope', '$route', '$location', '$http', 'Collection', 'data', 'Authz', 'Alert', 'Metadata', 'Title',
    function($scope, $route, $location, $http, Collection, data, Authz, Alert, Metadata, Title) {

  $scope.result = data.result;
  $scope.error = data.result.error;
  $scope.query = data.query;
  $scope.session = data.metadata.session;
  $scope.metadata = data.metadata;
  $scope.authz = Authz;
  $scope.collectionFacet = data.query.sortFacet(data.result.collections.values,
                                                 'filter:collection_id');
  $scope.jurisdictionFacet = data.query.sortFacet(data.result.facets.jurisdiction_code.values,
                                                  'filter:jurisdiction_code');
  $scope.schemaFacet = data.query.sortFacet(data.result.facets.$schema.values,
                                            'filter:$schema');
  $scope.sortOptions = {
    score: 'Relevancy',
    alphabet: 'Alphabet',
    doc_count: 'Documents matched'
  };
  
  if (data.query.getQ()) {
    Title.set("Browse for '" + data.query.getQ() + "'", "entities");
  } else {
    Title.set("Browse entities", "entities");  
  }

  $scope.submitSearch = function(form) {
    data.query.set('q', $scope.query.state.q);
  };

  $scope.loadOffset = function(offset) {
    data.query.set('offset', offset);
  };

  $scope.editCollection = function(collection, $event) {
    $event.stopPropagation();
    Collection.edit(collection).then(function() {
      $route.reload();
    });
  };

}]);
