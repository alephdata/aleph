aleph.factory('Entity', ['$uibModal', '$q', '$http', 'Session',
    function($uibModal, $q, $http, Session) {

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
    get: function(id) {
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
