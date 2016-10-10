var loadNetworkFromQuery = ['$route', 'Network', function($route, Network) {
  var collectionId = $route.current.params.collection_id;
  return Network.fromQuery(collectionId);
}];

var loadNetwork = ['$route', 'Network', function($route, Network) {
  var collectionId = $route.current.params.collection_id,
      networkId = $route.current.params.network_id;
  return Network.get(collectionId, networkId);
}];

var loadNetworks = ['$route', 'Network', function($route, Network) {
  var collectionId = $route.current.params.collection_id;
  return Network.search(collectionId);
}];
