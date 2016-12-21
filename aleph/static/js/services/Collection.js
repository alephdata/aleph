import aleph from '../aleph';

aleph.factory('Collection', ['$q', '$http', '$location', '$uibModal', 'Query', 'Authz', 'Metadata',
    function($q, $http, $location, $uibModal, Query, Authz, Metadata) {

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

  function search(params) {
    var dfd = $q.defer();
    var query = Query.parse(),
        state = angular.copy(query.state);
    state['limit'] = 20;
    angular.extend(state, params);
    Metadata.get().then(function() {
      $http.get('/api/1/collections', {params: state}).then(function(res) {
        res.data.results.forEach(function(coll) {
          addClientFields(coll);
        });
        dfd.resolve({
          'query': query,
          'result': res.data
        });
      }, function(err) {
        dfd.reject(err);
      });
    }, function(err) {
      dfd.reject(err);
    });
    return dfd.promise;
  }

  function getUserCollections() {
    var dfd = $q.defer(),
        params = {
          managed: 'false',
          permission: Authz.WRITE,
          limit: 100
        };
    search(params).then(function(res) {
      dfd.resolve(res.result.results);
    }, function(err) {
      dfd.reject(err);
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
    }, function(err) {
      dfd.reject(err);
    });
    return dfd.promise;
  };

  return {
    getUserCollections: getUserCollections,
    create: function() {
      var instance = $uibModal.open({
        templateUrl: 'templates/collections/create.html',
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
    search: search,
    delete: function(collection) {
      var instance = $uibModal.open({
        templateUrl: 'templates/collections/delete.html',
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
