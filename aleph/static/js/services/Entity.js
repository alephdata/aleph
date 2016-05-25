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
    search: function() {
      var dfd = $q.defer();
      Alert.index().then(function(alerts) {
        var query = Query.parse(),
            state = angular.copy(query.state);
        state['limit'] = 20;
        state['doc_counts'] = 'true';
        state['facet'] = ['jurisdiction_code', '$schema'];
        state['offset'] = state.offset || 0;
        $http.get('/api/1/entities', {params: state}).then(function(res) {
          var result = res.data;
          for (var i in result.results) {
            var res = result.results[i];
            res.alert_id = null;
            for (var j in alerts.results) {
              var alert = alerts.results[j];
              if (alert.entity_id == res.id && !alert.query_text) {
                res.alert_id = alert.id;
              }
            }
          }
          dfd.resolve({
            'query': query,
            'result': result
          });  
        }, function(err) {
          if (err.status == 400) {
            dfd.resolve({
              'result': {
                'error': err.data
              },
              'query': query
            });
          }
          dfd.reject(err);  
        });
      }, function(err) {
        dfd.reject(err);
      }); 
      return dfd.promise;
    },
    create: function(entity) {
      var instance = $uibModal.open({
        templateUrl: 'templates/entity_create.html',
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
        templateUrl: 'templates/entity_edit.html',
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
    deleteMany: function(entities) {
      var instance = $uibModal.open({
        templateUrl: 'templates/entity_delete.html',
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
        templateUrl: 'templates/entity_merge.html',
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
