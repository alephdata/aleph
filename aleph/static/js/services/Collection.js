aleph.factory('Collection', ['$q', '$uibModal', 'Metadata', 'Authz', function($q, $uibModal, Metadata, Authz) {

  var getWriteable = function() {
    var dfd = $q.defer();
    Metadata.get().then(function(metadata) {
      var collections = [];
      for (var cid in metadata.collections) {
        var col = metadata.collections[cid];
        if (Authz.collection(Authz.WRITE, col.id) && !col.managed) {
          collections.push(col);
        }
      }
      collections = collections.sort(function(a, b) {
        if (a.updated_at == b.updated_at) {
          return a.label.localeCompare(b.label);
        }
        return b.updated_at.localeCompare(a.updated_at);
      });
      dfd.resolve(collections);
    });
    return dfd.promise;
  };

  return {
    getWriteable: getWriteable,
    edit: function(collection) {
      var instance = $uibModal.open({
        templateUrl: 'templates/collections_edit.html',
        controller: 'CollectionsEditCtrl',
        backdrop: true,
        size: 'lg',
        resolve: {
          collection: ['$q', '$http', function($q, $http) {
            var dfd = $q.defer();  
            $http.get('/api/1/collections/' + collection.id).then(function(res) {
              dfd.resolve(res.data);
            }, function(err) {
              dfd.reject(err);
            });
            return dfd.promise;
          }],
          roles: ['$q', 'Role', function($q, Role) {
            var dfd = $q.defer();
            Role.getAll().then(function(res) {
              var roles = [];
              for (var i in res.results) {
                var role = res.results[i];
                if (role.type == 'user') {
                  roles.push(role);  
                }
              }
              dfd.resolve(roles);
            }, function(err) {
              dfd.reject(err);
            });
            return dfd.promise;
          }]
        }
      });
      return instance.result;
    },
    delete: function(collection) {
      var instance = $uibModal.open({
        templateUrl: 'templates/collections_delete.html',
        controller: 'CollectionsDeleteCtrl',
        backdrop: true,
        size: 'md',
        resolve: {
          collection: function() {
            return collection;
          }
        }
      });
      return instance.result;
    }
  };
}]);
