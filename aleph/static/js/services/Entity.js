aleph.factory('Entity', ['$uibModal', '$q', '$http', 'Alert', 'Metadata', 'Query',
    function($uibModal, $q, $http, Alert, Metadata, Query) {

  var getById = function(id) {
    var dfd = $q.defer(),
        url = '/api/1/entities/' + id;
    $http.get(url).then(function(res) {
      dfd.resolve(res.data);
    }, function(err) {
      dfd.reject(err);
    });
    return dfd.promise;
  }

  return {
    searchCollection: function(collection_id) {
      var dfd = $q.defer();
      var query = Query.parse(),
          state = angular.copy(query.state);
      state['limit'] = 20;
      state['filter:collection_id'] = collection_id;
      state['doc_counts'] = 'true';
      state['facet'] = ['countries', 'schemata'];
      state['offset'] = state.offset || 0;
      $http.get('/api/1/entities', {params: state}).then(function(res) {
        dfd.resolve({
          'query': query,
          'result': res.data
        });
      }, function(err) {
        dfd.reject(err);
      });
      return dfd.promise;
    },
    search: function() {
      var dfd = $q.defer();
      var query = Query.parse(),
          state = angular.copy(query.state);
      state['limit'] = 30;
      state['doc_counts'] = 'false';
      state['facet'] = ['countries', 'schemata', 'dataset', 'collections'];
      state['offset'] = state.offset || 0;
      $http.get('/api/1/entities', {params: state}).then(function(res) {
        dfd.resolve({
          'query': query,
          'result': res.data
        });
      }, function(err) {
        dfd.reject(err);
      });
      return dfd.promise;
    },
    create: function(entity) {
      var instance = $uibModal.open({
        templateUrl: 'templates/entities/create.html',
        controller: 'EntitiesCreateCtrl',
        backdrop: true,
        size: 'md',
        resolve: {
          entity: function() {
            return entity;
          },
          metadata: Metadata.get()
        }
      });
      return instance.result;
    },
    get: getById,
    edit: function(entity_id) {
      var instance = $uibModal.open({
        templateUrl: 'templates/entities/edit.html',
        controller: 'EntitiesEditCtrl',
        backdrop: true,
        size: 'lg',
        resolve: {
          entity: getById(entity_id),
          metadata: Metadata.get(),
          alerts: Alert.index()
        }
      });
      return instance.result;
    },
    save: function(entity) {
      var dfd = $q.defer(),
          url = '/api/1/entities/' + entity.id;
      $http.post(url, entity).then(function(res) {
        dfd.resolve(res.data);
      }, function(err) {
        dfd.reject(err);
      });
      return dfd.promise;
    },
    deleteMany: function(entities) {
      if (!entities.length) {
        var dfd = $q.defer()
        dfd.resolve();
        return dfd.promise;
      }
      var instance = $uibModal.open({
        templateUrl: 'templates/entities/delete.html',
        controller: 'EntitiesDeleteCtrl',
        backdrop: true,
        size: 'md',
        resolve: {
          entities: function() {
            return entities;
          }
        }
      });
      return instance.result;
    },
    merge: function(entities) {
      var instance = $uibModal.open({
        templateUrl: 'templates/entities/merge.html',
        controller: 'EntitiesMergeCtrl',
        backdrop: true,
        size: 'md',
        resolve: {
          entities: function() {
            return entities;
          }
        }
      });
      return instance.result;
    }
  };
}]);
