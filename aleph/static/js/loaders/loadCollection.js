var loadCollection = ['$route', 'Collection', function($route, Collection) {
  var collectionId = $route.current.params.collection_id;
  return Collection.get(collectionId);
}];
