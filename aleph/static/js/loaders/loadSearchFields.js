var loadSearchFields = ['$http', '$q', '$route', 'Query', 'Session',
  function($http, $q, $route, Query, Session) {
  var dfd = $q.defer();
  Session.get().then(function(session) {
    var q = angular.copy(Query.load());
    q['_uid'] = session.cbq;
    $http.get('/api/1/fields', {params: q}).then(function(res) {

      // var attributes = res.data;
      // attributes.has_attributes = false;
      // angular.forEach(res.data.attributes, function(enable, a) {
      //   attributes.has_attributes = true;
      // });

      // if (Query.state.attribute.length == 0) {
      //   angular.forEach(res.data.fields, function(enable, a) {
      //     if (enable) {
      //       Query.toggleFilter('attribute', a, true);
      //     }
      //   });
      // }

      dfd.resolve(res.data);
    });
  });
  return dfd.promise;
}];

