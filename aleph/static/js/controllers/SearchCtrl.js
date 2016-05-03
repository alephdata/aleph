
aleph.controller('SearchCtrl', ['$scope', '$route', '$location', '$http', 'Source', '$sce', 'data', 'Authz', 'Alert', 'Role', 'Title',
    function($scope, $route, $location, $http, Source, $sce, data, Authz, Alert, Role, Title) {

  var isLoading = false;
  $scope.result = {};
  $scope.sourceFacets = [];
  $scope.entityFacets = [];
  $scope.fields = data.metadata.fields;
  $scope.error = data.result.error;
  $scope.facets = [];
  $scope.session = data.metadata.session;
  $scope.metadata = data.metadata;
  $scope.query = data.query;
  $scope.authz = Authz;
  $scope.graph = {'limit': 75, 'options': [10, 75, 150, 300, 600, 1200]};
  $scope.sortOptions = {
    score: 'Relevancy',
    newest: 'Newest',
    oldest: 'Oldest'
  };
  
  if (data.query.getQ()) {
    Title.set("Search for '" + data.query.getQ() + "'", "documents");
  } else {
    Title.set("Search documents", "documents");  
  }

  $scope.loadOffset = function(offset) {
    data.query.set('offset', offset);
  };

  $scope.editSource = function(source, $event) {
    $event.stopPropagation();
    Source.edit(source).then(function() {
      $route.reload();
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
      data.query.set('collection', collections);
    });
  };

  $scope.hasAlert = function() {
    return data.result.alert !== null;
  };

  $scope.canCreateAlert = function() {
    return data.metadata.session.logged_in && !data.result.error;
  };

  $scope.toggleAlert = function() {
    if ($scope.hasAlert()) {
      Alert.delete($scope.result.alert);
      $scope.result.alert = null;
    } else {
      Alert.create($location.search()).then(function(alert) {
        $scope.result.alert = alert.id;
      });
    }
  };

  var initFacets = function() {
    if (data.result.error) {
      return;
    }
    var query = data.query;
    $scope.sourceFacets = query.sortFacet(data.result.sources.values, 'filter:source_id');
    $scope.entityFacets = query.sortFacet(data.result.entities, 'entity');

    var queryFacets = query.getArray('facet'),
        facets = [];

    for (var name in data.metadata.fields) {
      var facet = {
        field: name,
        label: data.metadata.fields[name],
        active: queryFacets.indexOf(name) != -1
      };
      if (data.result.facets[name]) {
        var values = data.result.facets[name].values;
        facet.values = query.sortFacet(values, 'filter:' + name);  
      }
      facets.push(facet);
    }

    $scope.facets = facets;
  };

  var initResults = function() {
    if (data.result.error) {
      $scope.result = {'results': []};
      return;
    }
    // allow HTML highlight results:
    for (var i in data.result.results) {
      var doc = data.result.results[i];
      for (var j in doc.records.results) {
        var rec = doc.records.results[j];
        rec.snippets = [];
        for (var n in rec.text) {
          var text = rec.text[n];
          rec.snippets.push($sce.trustAsHtml(text));
        }
      }
    }
    $scope.result = data.result;
    isLoading = false;
  };

  initFacets();
  initResults();

}]);
