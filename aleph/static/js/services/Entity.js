aleph.factory('Entity', ['$uibModal', function($uibModal) {

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
    }
  };
}]);
