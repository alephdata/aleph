
aleph.factory('Metadata', ['$http', '$q', '$rootScope', function($http, $q, $rootScope) {
    var dfd = null;

    var flush = function() {
      dfd = null;
      return get();
    };

    var load = function() {
      var dt = new Date();
      dfd = $q.defer();
      $q.all([
        $http.get('/api/1/sessions', {cache: false, params: {'_': dt.getTime()}}),
        $http.get('/api/1/metadata', {cache: true})
      ]).then(function(results) {
        var session = results[0].data,
            metadata = results[1].data;

        // still needed?
        session.cbq = session.logged_in ? session.role.id : 'anon';
        $rootScope.session = session;

        dfd.resolve({
          session: session,
          app: metadata.app,
          fields: metadata.fields,
          schemata: metadata.schemata,
          categories: metadata.categories,
          countries: metadata.countries, 
          languages: metadata.languages,
          flush: flush 
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
