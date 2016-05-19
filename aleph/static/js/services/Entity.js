aleph.factory('Entity', ['$uibModal', '$q', '$http', 'Session', 'Metadata', 'Alert',
    function($uibModal, $q, $http, Session, Metadata, Alert) {

  var getById = function(id) {
    var dfd = $q.defer(),
        url = '/api/1/entities/' + id;
    Session.get().then(function(session) {
      $http.get(url).then(function(res) {
        dfd.resolve(res.data);
      }, function(err) {
        dfd.reject(err);
      });
    });
    return dfd.promise;
  }

  return {
    create: function(entity) {
      var instance = $uibModal.open({
        templateUrl: 'templates/entity_create.html',
        controller: 'EntitiesCreateCtrl',
        backdrop: true,
        size: 'md',
        resolve: {
          entity: function() {
            return entity;
          }
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
