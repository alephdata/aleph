import aleph from '../aleph';

aleph.controller('EntitiesBulkCtrl', ['$scope', '$route', '$location', '$http', '$timeout', '$q', 'Entity', 'Authz', 'metadata', 'collection', 'Title',
    function($scope, $route, $location, $http, $timeout, $q, Entity, Authz, metadata, collection, Title) {

  $scope.collection = collection;
  $scope.entities = [{data: {}}, {data: {}}, {data: {}}, {data: {}}];
  $scope.created = [];
  $scope.schemata = metadata.schemata;
  $scope.availableSchemata = ['Person', 'Company', 'Organization', 'LegalEntity'];
  Title.set("Bulk create entities", "collections");

  $scope.editEntity = function($event, entity) {
    $event.stopPropagation();
    Entity.edit(entity.id);
  };

  $scope.isStub = function(entity) {
    if (!entity.name || !entity.name.length) {
      if (!entity.data.summary || !entity.data.summary.length) {
        return true;
      }
    }
    return false;
  };

  $scope.isInvalid = function(entity) {
    if ($scope.isStub(entity)) {
      return false;
    }
    if (entity.$invalid) {
      return true;
    }
    if (entity.name && entity.name.trim().length > 2) {
      if ($scope.availableSchemata.indexOf(entity.schema) != -1) {
        return false;
      }
    }
    return true;
  };

  $scope.canSave = function() {
    var count = 0;
    for (var i in $scope.entities) {
      var ent = $scope.entities[i];
      if ($scope.isInvalid(ent)) {
        return false;
      }
      count++;
    }
    return count > 0;
  };

  $scope.update = function(entity) {
    entity.$invalid = false;
    var stubs = 0, lastEntity = null;
    for (var i in $scope.entities) {
      var ent = $scope.entities[i];
      if ($scope.isStub(ent)) {
        stubs++;
        if (lastEntity) {
          ent.schema = lastEntity.schema;
          ent.data.country = lastEntity.data.country;
        }
      } else {
        lastEntity = angular.copy(ent);
      }
    }

    if (stubs < 2) {
      $scope.entities.push({data: {}});
    }
  };

  var saveNextEntity = function() {
    for (var i in $scope.entities) {
      var entity = angular.copy($scope.entities[i]);
      if (!$scope.isStub(entity) && !$scope.isInvalid(entity)) {
        entity.collection_id = $scope.collection.id;
        $http.post('/api/1/entities', entity).then(function(res) {
          $scope.entities.splice(i, 1);
          $scope.created.push(res.data);
          saveNextEntity();
        }, function(err) {
          console.log('Error', err);
          $scope.entities[i].$invalid = true;
          saveNextEntity();
        });
        return;
      }
    }
    $scope.reportLoading(false);
  };

  $scope.save = function() {
    $scope.reportLoading(true);
    saveNextEntity();
  };
}]);
