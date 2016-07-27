
aleph.controller('SearchCtrl', ['$scope', '$route', '$location', '$timeout', '$anchorScroll', '$http', '$uibModal', 'Collection', 'Entity', 'Authz', 'Alert', 'Document', 'Ingest', 'Role', 'Title', 'data', 'peek', 'alerts', 'metadata',
    function($scope, $route, $location, $timeout, $anchorScroll, $http, $uibModal, Collection, Entity, Authz, Alert, Document, Ingest, Role, Title, data, peek, alerts, metadata) {

  $scope.fields = metadata.fields;
  $scope.peek = peek;
  $scope.collectionFacet = [];
  $scope.entityFacet = [];
  $scope.facets = [];
  $scope.authz = Authz;
  $scope.sortOptions = {
    score: 'Relevancy',
    newest: 'Newest',
    oldest: 'Oldest'
  };

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

  $scope.createEntity = function($event) {
    $event.stopPropagation();
    Entity.create({'name': $scope.originalText}).then(function() {
      $timeout(function() {
        reloadSearch();
      }, 100);
    });
  };

  function getAlert() {
    var alert = {};
    if ($scope.originalText.length >= 3) {
      alert.query_text = $scope.originalText;
    }
    if ($scope.query.getArray('entity').length == 1) {
      alert.entity_id = $scope.query.getArray('entity')[0];
    }
    return alert;
  };

  $scope.hasAlert = function() {
    return Alert.check(getAlert());
  };

  $scope.canCreateAlert = function() {
    if (!metadata.session.logged_in) {
      return false;
    }
    if ($scope.result.error) {
      return false;
    }
    return Alert.valid(getAlert());
  };

  $scope.toggleAlert = function() {
    return Alert.toggle(getAlert());
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
    Document.search().then(function(data) {
      updateSearch(data);
    });
    Document.peek().then(function(peek) {
      $scope.peek = peek;
    });
  };

  var updateSearch = function(data) {
    initFacets(data.query, data.result);
    $scope.result = data.result;
    $scope.query = data.query;
    $scope.queryString = data.query.toString();
    $scope.originalText = data.query.state.q ? data.query.state.q : '';
    
    if ($scope.query.getQ()) {
      Title.set("Search for '" + $scope.query.getQ() + "'", "documents");
    } else {
      Title.set("Search documents", "documents");  
    }
    $scope.reportLoading(false);
  };

  updateSearch(data);

}]);
