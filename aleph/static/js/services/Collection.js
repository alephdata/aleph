aleph.factory('Collection', ['$q', '$http', '$uibModal', 'Authz', function($q, $http, $uibModal, Authz) {
  var indexDfd = null;

  function index() {
    if (indexDfd === null) {
      indexDfd = $q.defer();
      var params = {
        ignoreLoadingBar: true,
        params: {limit: 10000}
      }
      $http.get('/api/1/collections', params).then(function(res) {
        indexDfd.resolve(res.data.results);
      }, function(err) {
        indexDfd.reject(err);
      });
    }
    return indexDfd.promise;
  };

  function flush() {
    indexDfd = null;
    return index();
  };

  var getWriteable = function() {
    var dfd = $q.defer();
    index().then(function(res) {
      var collections = [];
      for (var cid in res) {
        var col = res[cid];
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
    index: index,
    flush: flush,
    getWriteable: getWriteable,
    edit: function(collection) {
      var instance = $uibModal.open({
        templateUrl: 'templates/collections_edit.html',
        controller: 'CollectionsEditCtrl',
        backdrop: true,
        size: 'lg',
        resolve: {
          collection: function() {
            var dfd = $q.defer();  
            $http.get('/api/1/collections/' + collection.id).then(function(res) {
              dfd.resolve(res.data);
            }, function(err) {
              dfd.reject(err);
            });
            return dfd.promise;
          },
          roles: ['Role', function(Role) {
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
