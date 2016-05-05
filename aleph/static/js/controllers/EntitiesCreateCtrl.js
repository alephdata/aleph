aleph.controller('EntitiesCreateCtrl', ['$scope', '$http', '$uibModalInstance', 'Metadata', 'Session', 'Authz', 'Validation', 'entity',
    function($scope, $http, $uibModalInstance, Metadata, Session, Authz, Validation, entity) {

  $scope.availableSchemata = ['/entity/person.json#', '/entity/company.json#',
                              '/entity/organization.json#']
  $scope.selectSchema = !entity.$schema;
  $scope.entity = entity;
  $scope.collection = {};
  $scope.createCollection = false;
  $scope.collections = [];
  $scope.entity.$schema = $scope.entity.$schema || $scope.availableSchemata[0];
  $scope.jurisdictions = [];
  $scope.schemata = {};

  Metadata.get().then(function(metadata) {
    $scope.schemata = metadata.schemata;

    var jurisdictions = [{
      label: 'No country selected',
      value: null
    }];
    for (var value in metadata.countries) {
      jurisdictions.push({
        value: value,
        label: metadata.countries[value]
      });
    }
    $scope.jurisdictions = jurisdictions.sort(function(a, b) {
      if (a.value == null) return -1;
      if (b.value == null) return 1;
      return a.label.localeCompare(b.label);
    });

    var collections = [];
    for (var cid in metadata.collections) {
      var col = metadata.collections[cid];
      if (Authz.collection(Authz.WRITE, col.id)) {
        collections.push(col);
      }
    };
    $scope.collections = collections;
    if (!$scope.hasCollections()) {
      $scope.setCreateCollection(true);
    }
  });

  $scope.setSchema = function(schema) {
    $scope.entity.$schema = schema;
  };

  $scope.isPerson = function() {
    return $scope.entity.$schema == '/entity/person.json#';
  };

  $scope.hasCollections = function() {
    return $scope.collections.length > 0;
  };

  $scope.setCreateCollection = function(flag) {
    Session.get().then(function(session) {
      $scope.createCollection = flag;
      if (flag) {
        $scope.collection = {
          label: session.role.name + '\'s Watchlist'
        };
      } else {
        $scope.collection = $scope.collections[0];
      }
    });
  };

  $scope.canSave = function() {
    if ($scope.createCollection) {
      if (!$scope.collection.label || !$scope.collection.label.length > 2) {
        return false;
      }
    }
    return $scope.createEntity.$valid;
  }

  $scope.cancel = function() {
    $uibModalInstance.dismiss('cancel');
  };

  $scope.saveEntity = function() {
    $scope.entity.collections = [$scope.collection.id];
    var res = $http.post('/api/1/entities', $scope.entity);
    res.then(function(entity) {
      $uibModalInstance.close();
    });
    res.error(Validation.handle($scope.createEntity));
  }

  $scope.save = function(form) {
    if (!$scope.canSave()) {
      return false;
    }

    if (!$scope.createCollection) {
      $scope.saveEntity();
    } else {
      var res = $http.post('/api/1/collections', $scope.collection);
      res.then(function(res) {
        $scope.collection = res.data;
        Metadata.flush().then(function() {
          $scope.saveEntity();
        });
      });
      res.error(Validation.handle($scope.createEntity));
    }
  };

}]);
