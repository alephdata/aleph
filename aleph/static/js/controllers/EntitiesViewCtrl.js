aleph.controller('EntitiesViewCtrl', ['$scope', '$route', 'Authz', 'Title', 'Entity', 'entity', 'metadata',
    function($scope, $route, Authz, Title, Entity, entity, metadata) {

  var schema = metadata.schemata[entity.schema];
  entity.binds = schema.bindData(entity);

  $scope.authz = Authz;
  $scope.metadata = metadata;
  $scope.entity = entity;

  Title.set(entity.name, "entities");

  $scope.edit = function() {
    Entity.edit($scope.entity.id).then(function() {
      $route.reload();
    });
  };

}]);
