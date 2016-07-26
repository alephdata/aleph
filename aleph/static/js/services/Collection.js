aleph.factory('Collection', ['$q', '$http', '$uibModal', 'Authz', 'Metadata',
    function($q, $http, $uibModal, Authz, Metadata) {
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
    var dfd = $q.defer();
    indexDfd = null;
    index().then(function(colls) {
      // reload stored authz info.
      Metadata.flush().then(function() {
        dfd.resolve(colls);
      })
    });
    return dfd.promise;
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
    create: function(collection) {
      var instance = $uibModal.open({
        templateUrl: 'templates/collections_create.html',
        controller: 'CollectionsCreateCtrl',
        backdrop: true,
        size: 'md',
        resolve: {
          metadata: Metadata.get(),
          collection: function() {
            return collection;
          }
        }
      });
      return instance.result;
    },
    edit: function(collection) {
      var instance = $uibModal.open({
        templateUrl: 'templates/collections_edit.html',
        controller: 'CollectionsEditCtrl',
        backdrop: true,
        size: 'lg',
        resolve: {
          metadata: Metadata.get(),
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
