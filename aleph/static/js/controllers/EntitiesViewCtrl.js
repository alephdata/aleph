aleph.controller('EntitiesViewCtrl', ['$scope', '$http', 'Authz', 'Title', 'Entity', 'entity', 'metadata',
    function($scope, $http, Authz, Title, Entity, entity, metadata) {

  $scope.authz = Authz;
  $scope.metadata = metadata;
  $scope.entity = entity;

  Title.set(entity.name, "entities");

}]);
