aleph.controller('EntitiesEditCtrl', ['$scope', '$http', '$uibModalInstance', 'Metadata', 'Session', 'Authz', 'Alert', 'Entity', 'Validation', 'entity', 'metadata', 'alerts',
    function($scope, $http, $uibModalInstance, Metadata, Session, Authz, Alert, Entity, Validation, entity, metadata, alerts) {

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

  $scope.mergeDuplicate = function(dup) {
    var idx = $scope.duplicateOptions.indexOf(dup);
    if (idx != -1) {
      $scope.duplicateOptions.splice(idx, 1);
    };
    var url = '/api/1/entities/' +  entity.id + '/merge/' + dup.id;
    $http.delete(url);
  };

  $scope.editDuplicate = function(dup) {
    Entity.edit(dup.id).then(function() {
      initDedupe();
    });
  };

  $scope.canSave = function() {
    return $scope.editEntity.$valid;
  };

  $scope.setSection = function(section) {
    $scope.section = section;
  };

  $scope.cancel = function() {
    $uibModalInstance.dismiss('cancel');
  };

  $scope.save = function(form) {
    if (!$scope.canSave()) {
      return false;
    }

    if ($scope.newOtherName.editing) {
      if ($scope.canAddOtherName()) {
        $scope.addOtherName();
      }
      return false;
    }

    var url = '/api/1/entities/' + $scope.entity.id;
    var res = $http.post(url, $scope.entity);
    res.then(function(res) {
      if ($scope.entity.haveAlert && !$scope.alertId) {
        Alert.create({entity_id: entity.id}).then(function() {
          $uibModalInstance.close(res.data);  
        });
      } else if (!$scope.entity.haveAlert && $scope.alertId) {
        Alert.delete($scope.alertId).then(function() {
          $uibModalInstance.close(res.data);  
        });
      } else {
        $uibModalInstance.close(res.data);
      }
    });
  };

}]);
