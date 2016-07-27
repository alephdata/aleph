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
        var collections = [];
        for (var i in res.data.results) {
          collections.push(addAuthzFlags(res.data.results[i]));
        }
        indexDfd.resolve(collections);
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

  function addAuthzFlags(coll) {
    coll.can_edit = Authz.collection(Authz.WRITE, coll.id);
    coll.can_add = coll.can_edit && !coll.managed;
    return coll;
  };

  function getWriteable() {
    var dfd = $q.defer();
    index().then(function(res) {
      var collections = [];
      for (var cid in res) {
        if (res[cid].can_add) {
          collections.push(res[cid]);
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

  var getCollection = function(id) {
    var dfd = $q.defer();  
    $http.get('/api/1/collections/' + id).then(function(res) {
      dfd.resolve(addAuthzFlags(res.data));
    }, function(err) {
      dfd.reject(err);
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
    get: getCollection,
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
