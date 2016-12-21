import aleph from '../aleph';

aleph.controller('EntitiesCreateCtrl', ['$scope', '$http', '$uibModalInstance', 'Authz', 'Collection', 'Alert', 'entity', 'metadata',
    function($scope, $http, $uibModalInstance, Authz, Collection, Alert, entity, metadata) {

  $scope.collectionCallback = null;
  $scope.blocked = false;
  $scope.availableSchemata = ['Person', 'Company', 'Organization'];
  $scope.selectSchema = !entity.schema;
  $scope.entity = entity;
  $scope.entity.data = $scope.entity.data || {};
  $scope.entity.country = $scope.entity.country || null;
  $scope.entity.schema = $scope.entity.schema || $scope.availableSchemata[0];
  $scope.createAlert = true;
  $scope.schemata = metadata.schemata;

  $scope.setSchema = function(schema) {
    $scope.entity.schema = schema;
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
      $scope.entity.collection_id = collection.id;
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
