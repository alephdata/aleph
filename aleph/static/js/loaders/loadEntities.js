var loadEntitiesSearch = ['Entity', function(Entity) {
  return Entity.search();
}];

var loadEntity = ['$route', 'Entity', function($route, Entity) {
  var entityId = $route.current.params.entity_id;
  return Entity.get(entityId);
}];

var loadEntityLinks = ['$route', 'Link', function($route, Link) {
  var entityId = $route.current.params.entity_id;
  return Link.search(entityId, {});
}];
