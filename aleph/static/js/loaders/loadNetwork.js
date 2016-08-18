var loadNetworkFromQuery = ['$route', 'Network', function($route, Network) {
  var collectionId = $route.current.params.collection_id;
  return Network.fromQuery(collectionId);
}];
