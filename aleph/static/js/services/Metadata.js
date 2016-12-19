import aleph from '../aleph';
import alephCore from '../schema';

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
          metadata = angular.extend(results[1].data, {session: session}),
          schemata = {};

      // TODO: move the schema stuff somewhere else?
      for (var name in metadata.schemata) {
        schemata[name] = new alephCore.Schema(name, metadata.schemata[name]);
      }
      metadata.schemata = schemata;
      metadata.bindSchema = function(obj) {
        obj.$schema = metadata.schemata[obj.schema];
        obj.binds = obj.$schema.bindData(obj);
        return obj;
      };

      $rootScope.session = session;

      dfd.resolve(metadata);
    }, function(err) {
      dfd.reject(err);
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
