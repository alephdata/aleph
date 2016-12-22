import aleph from '../aleph';

aleph.factory('Entity', ['$uibModal', '$q', '$http', 'Alert', 'Metadata', 'Query',
    function($uibModal, $q, $http, Alert, Metadata, Query) {

  var getById = function(id) {
    var dfd = $q.defer(),
        url = '/api/1/entities/' + id;
    Metadata.get().then(function(metadata) {
      $http.get(url).then(function(res) {
        var entity = metadata.bindSchema(res.data);
        dfd.resolve(entity);
      }, function(err) {
        dfd.reject(err);
      });
    }, function(err) {
      dfd.reject(err);
    });

    return dfd.promise;
  }

  var searchQuery = function(url, query, state) {
    var dfd = $q.defer();
    state['offset'] = state.offset || 0;
    Metadata.get().then(function(metadata) {
      $http.get(url, {params: state}).then(function(res) {
        for (var i in res.data.results) {
          metadata.bindSchema(res.data.results[i]);
        }
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

  return {
    searchCollection: function(collection_id) {
      var query = Query.parse(),
          state = angular.copy(query.state);
      state['limit'] = 20;
      state['filter:collection_id'] = collection_id;
      state['doc_counts'] = 'true';
      state['facet'] = ['countries', 'schemata'];
      return searchQuery('/api/1/entities', query, state);
    },
    search: function() {
      var query = Query.parse(),
          state = angular.copy(query.state);
      state['limit'] = 30;
      state['facet'] = ['countries', 'schemata', 'dataset', 'collections'];
      return searchQuery('/api/1/entities', query, state);
    },
    searchSimilar: function(entityId, prefix) {
      var query = Query.parse(prefix),
          state = angular.copy(query.state);
      state['limit'] = 5;
      state['facet'] = [];
      state['strict'] = state.strict || true;
      return searchQuery('/api/1/entities/' + entityId + '/similar', query, state);
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
