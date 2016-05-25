aleph.controller('EntitiesEditCtrl', ['$scope', '$http', '$q', '$uibModalInstance', 'Metadata', 'Authz', 'Alert', 'Entity', 'Validation', 'entity', 'metadata', 'alerts',
    function($scope, $http, $q, $uibModalInstance, Metadata, Authz, Alert, Entity, Validation, entity, metadata, alerts) {

  $scope.blocked = false;
  $scope.entity = entity;
  $scope.entity.jurisdiction_code = entity.jurisdiction_code || null;
  $scope.originalName = entity.name + '';
  $scope.section = 'base';
  $scope.isEntity = entity.$schema == '/entity/entity.json#';
  $scope.isPerson = entity.$schema == '/entity/person.json#';
  $scope.isCompany = entity.$schema == '/entity/company.json#';
  $scope.isOrganization = (entity.$schema == '/entity/organization.json#') || $scope.isCompany;
  $scope.newOtherName = {editing: false};
  $scope.duplicateOptions = [];
  // console.log(entity, $scope.isPerson);

  var initDedupe = function() {
    $http.get('/api/1/entities/' + entity.id + '/similar').then(function(res) {
      $scope.duplicateOptions = res.data.results;
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

  $scope.editOtherName = function(flag) {
    $scope.newOtherName.editing = flag;
  };

  $scope.addOtherName = function() {
    var newOtherName = angular.copy($scope.newOtherName);
    newOtherName.display_name = newOtherName.name;
    $scope.newOtherName = {editing: true};
    $scope.entity.other_names.push(newOtherName);
  };

  $scope.canAddOtherName = function() {
    return $scope.newOtherName.name && $scope.newOtherName.name.length > 2;
  };

  $scope.removeOtherName = function(other_name) {
    var idx = $scope.entity.other_names.indexOf(other_name);
    if (idx != -1) {
      $scope.entity.other_names.splice(idx, 1);
    };
  };

  $scope.updateOtherName = function(other_name) {
    if (other_name.display_name.trim().length > 2) {
      other_name.name = other_name.display_name;  
    };
  };

  $scope.removeIdentifier = function(identifier) {
    var idx = $scope.entity.identifiers.indexOf(identifier);
    if (idx != -1) {
      $scope.entity.identifiers.splice(idx, 1);
    };
  };

  $scope.editDuplicate = function(dup) {
    Entity.edit(dup.id).then(function() {
      initDedupe();
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
    if ($scope.newOtherName.editing) {
      // todo, detect save button clicks.
      if ($scope.canAddOtherName()) {
        $scope.addOtherName();
      }
      return false;
    }

    $scope.blocked = true;
    var url = '/api/1/entities/' + $scope.entity.id;
    var res = $http.post(url, $scope.entity);
    res.then(function(res) {
      updateAlert().then(function() {
        mergeDuplicates().then(function() {
          $uibModalInstance.close(res.data);
        });
      });
    });
  };

}]);
