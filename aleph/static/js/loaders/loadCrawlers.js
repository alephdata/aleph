
var loadCrawlers = ['$http', '$q', '$route', 'Session',
    function($http, $q, $route, Session) {
  var dfd = $q.defer();

  Session.get().then(function(session) {
    $http.get('/api/1/crawlers').then(function(res) {
      dfd.resolve(res.data.results);
    }, function(err) {
      dfd.reject(err);  
    });
  }, function(err) {
    dfd.reject(err);
  });

  return dfd.promise;
}];
