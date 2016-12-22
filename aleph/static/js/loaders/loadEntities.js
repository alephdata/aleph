var loadEntitiesSearch = ['Entity', function(Entity) {
  return Entity.search();
}];

var loadEntity = ['$route', 'Entity', function($route, Entity) {
  var entityId = $route.current.params.entity_id;
  return Entity.get(entityId);
}];

var loadSimilarEntities = ['$route', 'Entity', function($route, Entity) {
  var entityId = $route.current.params.entity_id;
  return Entity.searchSimilar(entityId, 'similar_');
}];

var loadEntityLinks = ['$route', 'Link', function($route, Link) {
  var entityId = $route.current.params.entity_id;
  return Link.search(entityId, 'links_');
}];

var loadEntityDocuments = ['$route', 'Document', function($route, Document) {
  var entityId = $route.current.params.entity_id;
  return Document.searchEntity(entityId, 'documents_');
}];

export {loadEntitiesSearch, loadEntity, loadSimilarEntities, loadEntityLinks,
        loadEntityDocuments};
