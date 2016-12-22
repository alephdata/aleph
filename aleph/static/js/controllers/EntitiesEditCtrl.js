import aleph from '../aleph';

aleph.controller('EntitiesEditCtrl', ['$scope', '$http', '$q', '$uibModalInstance', 'Metadata', 'Authz', 'Alert', 'Entity', 'entity', 'metadata', 'alerts',
    function($scope, $http, $q, $uibModalInstance, Metadata, Authz, Alert, Entity, entity, metadata, alerts) {

  $scope.blocked = false;
  $scope.entity = entity;
  $scope.entity.country = entity.country || null;
  $scope.originalName = entity.name + '';
  $scope.section = 'base';
  $scope.isEntity = entity.schema == 'LegalEntity';
  $scope.isPerson = entity.schema == 'Person';
  $scope.isCompany = entity.schema == 'Company';
  $scope.isOrganization = (entity.schema == 'Organization') || $scope.isCompany;
  $scope.newAlias = null;
  $scope.newAliasEditing = false;
  $scope.duplicateOptions = [];

  var initDedupe = function() {
    var url = '/api/1/entities/' + entity.id + '/similar',
        params = {
          strict: false,
          'filter:collection_id': entity.collection_id
        };
    $http.get(url, {params: params}).then(function(res) {
      $scope.duplicateOptions = res.data.results;
    }, function(err) {
      console.log('Error', err);
      $scope.duplicateOptions = [];
    });
  };

  var initAlerts = function() {
    $scope.alertId = null;
    for (var i in alerts.results) {
      var alert = alerts.results[i];
      if (!alert.query_text && alert.entity_id == $scope.entity.id) {
        $scope.alertId = alert.id;
      }
    }
    $scope.entity.haveAlert = $scope.alertId != null;
  };

  initDedupe();
  initAlerts();

  $scope.editNewAlias = function(flag) {
    $scope.newAliasEditing = flag;
  };

  $scope.editAlias = function($index, value) {
    $scope.entity.data.alias[$index] = value;
  };

  $scope.addAlias = function() {
    var newAlias = angular.copy($scope.newAlias);
    $scope.newAlias = null;
    $scope.entity.data.alias = $scope.entity.data.alias || [];
    $scope.entity.data.alias.push(newAlias);
  };

  $scope.canAddAlias = function() {
    return $scope.newAlias && $scope.newAlias.length > 2;
  };

  $scope.removeAlias = function(alias) {
    var idx = $scope.entity.data.alias.indexOf(alias);
    if (idx != -1) {
      $scope.entity.data.alias.splice(idx, 1);
    };
  };

  $scope.editDuplicate = function(dup) {
    Entity.edit(dup.id).then(function() {
      initDedupe();
    }, function(err) {
      console.log('Error', err);
    });
  };

  $scope.canSave = function() {
    if ($scope.blocked) {
      return false;
    }
    return $scope.editEntity.$valid;
  };

  $scope.setSection = function(section) {
    $scope.section = section;
  };

  $scope.cancel = function() {
    $uibModalInstance.dismiss('cancel');
  };

  var updateAlert = function() {
    var done = $q.defer();
    if ($scope.entity.haveAlert && !$scope.alertId) {
      Alert.create({entity_id: entity.id}).then(function() {
        done.resolve();
      });
    } else if (!$scope.entity.haveAlert && $scope.alertId) {
      Alert.delete($scope.alertId).then(function() {
        done.resolve();
      });
    } else {
      done.resolve();
    }
    return done.promise;
  };

  var mergeDuplicates = function() {
    var done = $q.defer(),
        merges = [];
    for (var i in $scope.duplicateOptions) {
      var dup = $scope.duplicateOptions[i];
      if (dup.$merge) {
        var url = '/api/1/entities/' +  $scope.entity.id + '/merge/' + dup.id;
        merges.push($http.delete(url));
      }
    }
    $q.all(merges).then(function() {
      done.resolve();
    })
    return done.promise;
  };

  $scope.save = function(form) {
    if (!$scope.canSave()) {
      return false;
    }

    // check that we're not in the process of adding alternate
    // names and accidentally submitting the form.
    if ($scope.newAliasEditing) {
      // todo, detect save button clicks.
      if ($scope.canAddAlias()) {
        $scope.addAlias();
      }
      return false;
    }

    $scope.blocked = true;
    Entity.save($scope.entity).then(function(entity) {
      updateAlert().then(function() {
        mergeDuplicates().then(function() {
          $uibModalInstance.close(entity);
        });
      });
    }, function(err) {
      console.log('Error', err);
      $scope.blocked = false;
    });
  };
}]);
