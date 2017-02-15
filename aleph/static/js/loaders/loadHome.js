var loadStatistics = ['$http', '$q', '$route', function($http, $q, $route) {
  return $http.get('/api/1/statistics', {cache: true}).then(function(res) {
    return res.data;
  });
}];

var loadCollectionFacets = ['$http', '$q', '$route', function($http, $q, $route) {
  var params = {cache: true, params: {limit: 0, facet: ['countries', 'category']}};
  return $http.get('/api/1/collections', params).then(function(res) {
    return res.data.facets;
  });
}];
