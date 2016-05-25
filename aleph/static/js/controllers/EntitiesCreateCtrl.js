aleph.controller('EntitiesCreateCtrl', ['$scope', '$http', '$uibModalInstance', 'Authz', 'Collection', 'Alert', 'Validation', 'entity', 'metadata',
    function($scope, $http, $uibModalInstance, Authz, Collection, Alert, Validation, entity, metadata) {

  $scope.collectionCallback = null;
  $scope.blocked = false;
  $scope.availableSchemata = ['/entity/person.json#', '/entity/company.json#',
                              '/entity/organization.json#'];
  $scope.selectSchema = !entity.$schema;
  $scope.entity = entity;
  $scope.entity.jurisdiction_code = $scope.entity.jurisdiction_code || null;
  $scope.entity.$schema = $scope.entity.$schema || $scope.availableSchemata[0];
  $scope.createAlert = true;
  $scope.schemata = metadata.schemata;

  $scope.setSchema = function(schema) {
    $scope.entity.$schema = schema;
  };

  $scope.setCollection = function(callback) {
    $scope.collectionCallback = callback;
  };

  $scope.canSave = function() {
    if ($scope.blocked || $scope.collectionCallback == null) {
      return false;
    }
    return $scope.createEntity.$valid;
  }

  $scope.cancel = function() {
    $uibModalInstance.dismiss('cancel');
  };

  $scope.save = function(form) {
    if (!$scope.canSave()) {
      return false;
    }
    $scope.blocked = true;
    $scope.collectionCallback().then(function(collection) {
      $scope.entity.collections = [collection.id];
      $http.post('/api/1/entities', $scope.entity).then(function(res) {
        if ($scope.createAlert) {
          var alert = {entity_id: res.data.id};
          Alert.create({entity_id: res.data.id}).then(function() {
            $uibModalInstance.close(res.data);  
          });
        } else {
          $uibModalInstance.close(res.data);  
        }
      });
    });
  };

}]);
