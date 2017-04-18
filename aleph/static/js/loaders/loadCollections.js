var loadProjectCollections = ['Collection', function(Collection) {
  return Collection.search({
    managed: false,
    counts: true,
    facet: ['countries']
  });
}];

var loadSourceCollections = ['Collection', function(Collection) {
  return Collection.search({
    managed: true,
    counts: true,
    facet: ['countries', 'category']
  });
}];

var loadCollection = ['$route', 'Collection', function($route, Collection) {
  var collectionId = $route.current.params.collection_id;
  return Collection.get(collectionId);
}];

var loadCollectionDeep = ['$route', '$q', 'Collection', 'Role', function($route, $q, Collection, Role) {
  var dfd = $q.defer();
  var collectionId = $route.current.params.collection_id;

  Collection.get(collectionId).then(function(collection) {
    collection.creator = {};
    if (!collection.creator_id) {
      dfd.resolve(collection);
    } else {
      Role.get(collection.creator_id).then(function(role) {
        collection.creator = role;
        dfd.resolve(collection);
      }, function(err) {
        dfd.reject(err);
      });
    }
  }, function(err) {
    dfd.reject(err);
  });
  return dfd.promise;
}];

var loadCollectionDocuments = ['$route', 'Document', function($route, Document) {
  var collectionId = $route.current.params.collection_id;
  return Document.search(collectionId);
}];

var loadCollectionEntities = ['$route', 'Entity', function($route, Entity) {
  var collectionId = $route.current.params.collection_id;
  return Entity.searchCollection(collectionId);
}];

var loadCollectionLeads = ['$route', 'Lead', function($route, Lead) {
  var collectionId = $route.current.params.collection_id;
  return Lead.search(collectionId);
}];


export {
  loadProjectCollections, loadSourceCollections, loadCollection,
  loadCollectionDocuments, loadCollectionEntities, loadCollectionLeads,
  loadCollectionDeep
};
