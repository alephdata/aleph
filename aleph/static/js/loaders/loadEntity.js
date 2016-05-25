var loadEntity = ['$http', '$q', '$location', '$route', 'Entity',
    function($http, $q, $location, $route, Entity) {
  var dfd = $q.defer(),
      entitytId = $route.current.params.entity_id;

  Entity.get(entitytId).then(function(entity) {
    dfd.resolve({
      entity: entity,
    });
  }, function(err) {
    dfd.reject(err);
  });
  return dfd.promise;
}];
