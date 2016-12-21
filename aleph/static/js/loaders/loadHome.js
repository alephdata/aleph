var loadStatistics = ['$http', '$q', '$route', function($http, $q, $route) {
  return $http.get('/api/1/statistics', {cache: true}).then(function(res) {
    return res.data;
  });
}];

export default loadStatistics;
