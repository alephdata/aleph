aleph.controller('EntitiesEditCtrl', ['$scope', '$http', 'Metadata', 'Session', 'Authz', 'Validation', 'data',
    function($scope, $http, Metadata, Session, Authz, Validation, data) {

  $scope.availableSchemata = ['/entity/person.json#', '/entity/company.json#',
                              '/entity/organization.json#']
  $scope.entity = data.entity;

  // $scope.selectSchema = !entity.$schema;
  // $scope.entity = entity;
  // $scope.createAlert = true;
  // $scope.collection = {};
  // $scope.createCollection = false;
  // $scope.collections = [];
  // $scope.entity.$schema = $scope.entity.$schema || $scope.availableSchemata[0];
  // $scope.schemata = {};

  // Metadata.get().then(function(metadata) {
  //   $scope.schemata = metadata.schemata;

  //   var collections = [];
  //   for (var cid in metadata.collections) {
  //     var col = metadata.collections[cid];
  //     if (Authz.collection(Authz.WRITE, col.id)) {
  //       collections.push(col);
  //     }
  //   };
  //   $scope.collections = collections;
  //   if (!$scope.hasCollections()) {
  //     $scope.setCreateCollection(true);
  //   }
  // });

  // $scope.setSchema = function(schema) {
  //   $scope.entity.$schema = schema;
  // };

  // $scope.isPerson = function() {
  //   return $scope.entity.$schema == '/entity/person.json#';
  // };

  // $scope.hasCollections = function() {
  //   return $scope.collections.length > 0;
  // };

  // $scope.setCreateCollection = function(flag) {
  //   Session.get().then(function(session) {
  //     $scope.createCollection = flag;
  //     if (flag) {
  //       $scope.collection = {
  //         label: session.role.name + '\'s Watchlist'
  //       };
  //     } else {
  //       $scope.collection = $scope.collections[0];
  //     }
  //   });
  // };

  $scope.canSave = function() {
    // if ($scope.createCollection) {
    //   if (!$scope.collection.label || !$scope.collection.label.length > 2) {
    //     return false;
    //   }
    // }
    return $scope.editEntity.$valid;
  }

  $scope.save = function(form) {
    if (!$scope.canSave()) {
      return false;
    }
    var url = '/api/1/entities/' + $scope.entity.id;
    var res = $http.post(url, $scope.entity);
    res.then(function(res) {
      // if ($scope.createAlert) {
      //   var alert = {entity_id: res.data.id};
      //   $http.post('/api/1/alerts', alert).then(function(ares) {
      //     $uibModalInstance.close(res.data);  
      //   });
      // } else {
      //   $uibModalInstance.close(res.data);  
      // }
      console.log('Saved.');
    });
  };

}]);
