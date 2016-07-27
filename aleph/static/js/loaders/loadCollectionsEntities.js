
var loadCollectionsEntities = ['$route', 'Entity', function($route, Entity) {
  var collectionId = $route.current.params.collection_id;
  return Entity.searchCollection(collectionId);
}];
