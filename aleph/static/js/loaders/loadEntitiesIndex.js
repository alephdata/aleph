
var loadEntitiesIndex = ['$http', '$q', '$route', '$location', 'Session', 'Metadata',
    function($http, $q, $route, $location, Session, Metadata) {
  var dfd = $q.defer();
  Metadata.get().then(function(metadata) {
    Session.get().then(function(session) {
      var query = angular.copy($location.search());
      query['limit'] = 30;
      query['facet'] = 'jurisdiction_code';
      query['offset'] = query.offset || 0;
      $http.get('/api/1/entities', {params: query}).then(function(res) {
        var result = res.data;
        dfd.resolve({
          'result': result,
          'metadata': metadata
        });
      }, function(err) {
        if (err.status == 400) {
          dfd.resolve({
            'result': {
              'error': err.data
            },
            'metadata': metadata
          });
        }
        dfd.reject(err);  
      });
    }, function(err) {
      dfd.reject(err);
    });
  }, function(err) {
    dfd.reject(err);
  });
  return dfd.promise;
}];
