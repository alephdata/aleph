
aleph.factory('Metadata', ['$http', '$q', '$rootScope', function($http, $q, $rootScope) {
  var dfd = null,
      metadata = null;

  var flush = function() {
    dfd = null;
    metadata = null;
    return get();
  };

  var load = function() {
    var dt = new Date();
    dfd = $q.defer();
    $q.all([
      $http.get('/api/1/sessions', {cache: false, params: {'_': dt.getTime()}}),
      $http.get('/api/1/metadata', {cache: true})
    ]).then(function(results) {
      metadata = results[1].data;
      $rootScope.session = results[0].data;

      dfd.resolve({
        session: results[0].data,
        app: metadata.app,
        fields: metadata.fields,
        graph: metadata.graph,
        schemata: metadata.schemata,
        categories: metadata.categories,
        countries: metadata.countries, 
        languages: metadata.languages
      });
    });
  };

  var get = function() {
    if (dfd === null) {
      load();
    }
    return dfd.promise;
  };

  return {
    get: get,
    flush: flush
  };

}]);
