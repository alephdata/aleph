
aleph.controller('EntitiesIndexCtrl', ['$scope', '$http', '$timeout', '$anchorScroll', 'Collection', 'Entity', 'data', 'metadata', 'alerts', 'Authz', 'Alert', 'Title',
    function($scope, $http, $timeout, $anchorScroll, Collection, Entity, data, metadata, alerts, Authz, Alert, Title) {

  $scope.authz = Authz;
  $scope.sortOptions = {
    score: 'Relevancy',
    alphabet: 'Alphabet',
    doc_count: 'Documents matched'
  };

  $scope.submitSearch = function(form) {
    $scope.query.set('q', $scope.query.state.q);
  };

  $scope.loadOffset = function(offset) {
    $scope.query.set('offset', offset);
    $anchorScroll();
  };

  $scope.editCollection = function(collection, $event) {
    $event.stopPropagation();
    Collection.edit(collection).then(function() {
      reloadSearch();
    });
  };

  $scope.getReconciliationUrl = function() {
    var url = metadata.app.url + 'api/freebase/reconcile';
    if (metadata.session.logged_in) {
      url += '?api_key=' + metadata.session.api_key;
    }
    return url;
  };

  $scope.hasAlert = function(entity) {
    return Alert.check({entity_id: entity.id});
  };

  $scope.toggleAlert = function(entity) {
    return Alert.toggle({entity_id: entity.id});
  };

  $scope.createEntity = function($event, name) {
    if (name) {
      name = titleCaps(name);
    }
    $event.stopPropagation();
    Entity.create({name: name}).then(function() {
      $timeout(function() {
        reloadSearch();
      }, 500);
    });
  };

  $scope.editEntity = function($event, entity) {
    $event.stopPropagation();
    Entity.edit(entity.id).then(function() {
      $timeout(function() {
        reloadSearch();
      }, 500);
    });
  };

  $scope.getSelection = function() {
    var selection = [];
    for (var i in $scope.result.results) {
      var entity = $scope.result.results[i];
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
        reloadSearch();
      }, 500);
    });
  };

  $scope.mergeSelection = function($event) {
    Entity.merge($scope.getSelection()).then(function() {
      $timeout(function() {
        reloadSearch();
      }, 500);
    });
  };

  $scope.$on('$routeUpdate', function() {
    reloadSearch();
  });

  var reloadSearch = function() {
    Entity.search().then(function(data) {
      updateSearch(data);
    });
  };

  var updateSearch = function(data) {
    $scope.collectionFacet = data.query.sortFacet(data.result.facets.collections.values,
                                                 'filter:collection_id');
    $scope.jurisdictionFacet = data.query.sortFacet(data.result.facets.jurisdiction_code.values,
                                                    'filter:jurisdiction_code');
    $scope.schemaFacet = data.query.sortFacet(data.result.facets.$schema.values,
                                              'filter:$schema');
    $scope.result = data.result;
    $scope.query = data.query;
    
    if (data.query.getQ()) {
      Title.set("Browse for '" + data.query.getQ() + "'", "entities");
    } else {
      Title.set("Browse entities", "entities");  
    }
  };

  updateSearch(data);

}]);
