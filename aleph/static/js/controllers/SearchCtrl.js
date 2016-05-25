
aleph.controller('SearchCtrl', ['$scope', '$route', '$location', '$http', '$uibModal', 'Source', '$sce', 'Authz', 'Alert', 'Entity', 'Role', 'Title', 'data', 'metadata',
    function($scope, $route, $location, $http, $uibModal, Source, $sce, Authz, Alert, Entity, Role, Title, data, metadata) {

  $scope.result = data.result;
  $scope.sourceFacets = [];
  $scope.entityFacets = [];
  $scope.fields = metadata.fields;
  $scope.suggestEntity = null;
  $scope.facets = [];
  $scope.query = data.query;
  $scope.query_string = data.query.toString();
  $scope.originalText = data.query.state.q ? data.query.state.q : '';
  $scope.authz = Authz;
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
    if (!metadata.session.logged_in || data.result.error) {
      return false;
    }
    if ($scope.originalText.length >= 3) {
      return true;
    }
    if (data.query.getArray('entity').length == 1) {
      return true;
    }
    return false;
  };

  $scope.toggleAlert = function() {
    if ($scope.hasAlert()) {
      Alert.delete($scope.result.alert);
      $scope.result.alert = null;
    } else {
      var alert = {query_text: $scope.originalText};
      if (data.query.getArray('entity').length == 1) {
        alert.entity_id = data.query.getArray('entity')[0];
      }
      Alert.create(alert).then(function(alert) {
        $scope.result.alert = alert.id;
      });
    }
  };

  $scope.createQueryEntity = function(schema) {
    var name = $scope.originalText;
    name = name.replace(/[\"\'\(\)\[\]\+]*/, ' ');
    name = titleCaps(name);
    Entity.create({$schema: schema, name: name}).then(function() {
      $route.reload();
    });
  };

  $scope.setEntity = function(entity) {
    data.query.set('q', '');
    data.query.toggle('entity', entity.id);
  };

  $scope.showSuggest = function() {
    return $scope.suggestEntity && $scope.suggestEntity.id;
  };

  $scope.showCreate = function() {
    return !$scope.showSuggest() && $scope.originalText.length >= 3;
  };

  var initSuggest = function() {
    if ($scope.originalText.length < 3) {
      $scope.suggestEntity = null;
      return;
    }
    var params = {'prefix': $scope.originalText};
    $http.get('/api/1/entities/_suggest', {params: params}).then(function(res) {
      if (res.data.results && res.data.results.length && res.data.results[0].match) {
        $scope.suggestEntity = res.data.results[0];
      }
    });
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

    for (var name in metadata.fields) {
      var facet = {
        field: name,
        label: metadata.fields[name],
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

  initFacets();
  initSuggest();

}]);
