aleph.factory('Collection', ['$q', '$http', '$uibModal', 'Authz', 'Metadata',
    function($q, $http, $uibModal, Authz, Metadata) {
  var USER_CATEGORIES = ['investigation'];
  var indexDfd = null;

  function index() {
    if (indexDfd === null) {
      indexDfd = $q.defer();
      Metadata.get().then(function() {
        var params = {
          ignoreLoadingBar: true,
          params: {limit: 10000}
        }
        $http.get('/api/1/collections', params).then(function(res) {
          var collections = [];
          for (var i in res.data.results) {
            collections.push(addClientFields(res.data.results[i]));
          }
          indexDfd.resolve(collections);
        }, function(err) {
          indexDfd.reject(err);
        });
      });
    }
    return indexDfd.promise;
  };

  function flush() {
    var dfd = $q.defer();
    indexDfd = null;
    // reload stored authz info.
    Metadata.flush().then(function() {
      index().then(function(colls) {
        dfd.resolve(colls);
      })
    });
    return dfd.promise;
  };

  function addClientFields(coll) {
    coll.can_edit = Authz.collection(Authz.WRITE, coll.id);
    coll.can_add = coll.can_edit && !coll.managed;

    coll.getPath = function() {
      // this is a function because in the collections index 
      // the doc_count and entity_count is set after this is
      // called.
      var path = '/collections/' + coll.id;
      if (!coll.doc_count && coll.entity_count) {
        return path + '/entities';
      }
      return path;
    };
    
    return coll;
  };

  function getUserCollections() {
    var dfd = $q.defer();
    index().then(function(res) {
      var collections = [];
      for (var cid in res) {
        var c = res[cid];
        if (c.can_add && USER_CATEGORIES.indexOf(c.category) != -1) {
          collections.push(c);
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
    Metadata.get().then(function() {
      $http.get('/api/1/collections/' + id).then(function(res) {
        dfd.resolve(addClientFields(res.data));
      }, function(err) {
        dfd.reject(err);
      });
    });
    return dfd.promise;
  };

  return {
    index: index,
    flush: flush,
    getUserCollections: getUserCollections,
    create: function() {
      var instance = $uibModal.open({
        templateUrl: 'templates/collections_create.html',
        controller: 'CollectionsCreateCtrl',
        backdrop: true,
        size: 'md',
        resolve: {
          metadata: Metadata.get(),
          collection: function() {
            return {
              generate_entities: true,
              managed: false,
              category: 'investigation'
            };
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
