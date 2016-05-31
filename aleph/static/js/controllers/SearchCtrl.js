
aleph.controller('SearchCtrl', ['$scope', '$route', '$location', '$anchorScroll', '$http', '$uibModal', 'Source', 'Authz', 'Alert', 'Document', 'Role', 'Title', 'data', 'alerts', 'metadata',
    function($scope, $route, $location, $anchorScroll, $http, $uibModal, Source, Authz, Alert, Document, Role, Title, data, alerts, metadata) {

  $scope.fields = metadata.fields;
  $scope.sourceFacets = [];
  $scope.entityFacets = [];
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

  $scope.editSource = function(source, $event) {
    $event.stopPropagation();
    Source.edit(source).then(function() {
      reloadSearch();
    });
  };

  $scope.selectCollections = function($event) {
    $event.stopPropagation();
    var instance = $uibModal.open({
      templateUrl: 'templates/collections_select.html',
      controller: 'CollectionsSelectCtrl',
      backdrop: true,
      size: 'md',
      resolve: {
        collections: function() {
          return data.query.getArray('collection');
        }
      }
    });

    instance.result.then(function(collections) {
      $scope.query.set('collection', collections);
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
    $scope.sourceFacets = query.sortFacet(result.sources.values, 'filter:source_id');
    $scope.entityFacets = query.sortFacet(result.entities, 'entity');

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
    Document.search().then(function(data) {
      updateSearch(data);
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
  };

  updateSearch(data);

}]);
