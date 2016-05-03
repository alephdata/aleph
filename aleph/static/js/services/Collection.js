
aleph.factory('Collection', ['$uibModal', function($uibModal) {

  return {
    edit: function(collection) {
      var instance = $uibModal.open({
        templateUrl: 'templates/collections_edit.html',
        controller: 'CollectionsEditCtrl',
        backdrop: true,
        size: 'md',
        resolve: {
          collection: ['$q', '$http', 'Role', function($q, $http, Role) {
            var dfd = $q.defer();
            Role.getAll().then(function() {
              $http.get('/api/1/collections/' + collection.id).then(function(res) {
                dfd.resolve(res.data);
              }, function(err) {
                dfd.reject(err);
              });
            }, function(err) {
              dfd.reject(err);
            });
            return dfd.promise;
          }]
        }
      });
      return instance.result;
    }
  };
}]);
