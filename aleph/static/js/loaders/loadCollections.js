var loadCollections = ['$q', '$http', '$location', 'Collection', function($q, $http, $location, Collection) {
  return Collection.search({
    counts: true,
    facet: ['countries', 'category']
  });
}];

var loadUserCollections = ['Collection', function(Collection) {
  return Collection.getUserCollections();
}];

var loadCollectionFacets = ['$http', '$q', '$route', function($http, $q, $route) {
  var params = {cache: true, params: {limit: 0, facet: ['countries', 'category']}};
  return $http.get('/api/1/collections', params).then(function(res) {
    return res.data.facets;
  });
}];
