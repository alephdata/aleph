
aleph.factory('Metadata', ['$http', '$q', 'Session', 'Authz', function($http, $q, Session, Authz) {
    var dfd = null;

    var flush = function() {
      Session.flush();
      dfd = null;
      return get();
    };

    var load = function() {
      dfd = $q.defer();
      Session.get().then(function(session) {
        $q.all([
          $http.get('/api/1/collections?limit=1000&_uid=' + session.cbq),
          $http.get('/api/1/metadata', {cache: true})
        ]).then(function(results) {
            var collections = {},
                collectionsCount = 0, 
                metadata = results[1].data;
            angular.forEach(results[0].data.results, function(c) {
              collections[c.id] = c;
              collectionsCount++;
            });

            dfd.resolve({
              'session': session,
              'collections': collections,
              'collectionsList': results[0].data.results,
              'collectionsCount': collectionsCount,
              'fields': metadata.fields,
              'schemata': metadata.schemata,
              'source_categories': metadata.source_categories,
              'countries': metadata.countries, 
              'languages': metadata.languages
            });
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
