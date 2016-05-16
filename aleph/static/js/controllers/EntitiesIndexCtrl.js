
aleph.controller('EntitiesIndexCtrl', ['$scope', '$route', '$location', '$http', '$timeout', 'Collection', 'Entity', 'data', 'Authz', 'Alert', 'Metadata', 'Title',
    function($scope, $route, $location, $http, $timeout, Collection, Entity, data, Authz, Alert, Metadata, Title) {

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

  $scope.toggleAlert = function(entity) {
    if (entity.alert_id) {
      Alert.delete(entity.alert_id);
      entity.alert_id = null;
    } else {
      var alert = {entity_id: entity.id};
      Alert.create(alert).then(function(alert) {
        entity.alert_id = alert.id;
      });
    }
  };

  $scope.createEntity = function($event, name) {
    if (name) {
      name = titleCaps(name);
    }
    $event.stopPropagation();
    Entity.create({name: name}).then(function() {
      $timeout(function() {
        $route.reload();
      }, 500);
    });
  };

  $scope.editEntity = function($event, entity) {
    $event.stopPropagation();
    Entity.edit(entity.id).then(function() {
      $timeout(function() {
        $route.reload();
      }, 500);
    });
  };

  $scope.getSelection = function() {
    var selection = [];
    for (var i in data.result.results) {
      var entity = data.result.results[i];
      if (entity.selected) {
        selection.push(entity);
      }
    }
    return selection;
  };

  $scope.canDelete = function() {
    return $scope.getSelection().length > 0;
  };

  $scope.canMerge = function() {
    return $scope.getSelection().length > 1;
  };

  $scope.deleteSelection = function($event) {
    Entity.deleteMany($scope.getSelection()).then(function() {
      $timeout(function() {
        $route.reload();
      }, 500);
    });
  };

  $scope.mergeSelection = function($event) {
    Entity.merge($scope.getSelection()).then(function() {
      $timeout(function() {
        $route.reload();
      }, 500);
    });
  };

}]);
