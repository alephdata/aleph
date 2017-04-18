var loadPermissions = ['$q', '$route', '$http', function($q, $route, $http) {
  var dfd = $q.defer(),
      collectionId = $route.current.params.collection_id,
      permUrl = '/api/1/collections/' + collectionId + '/permissions';

  $http.get(permUrl).then(function(res) {
    dfd.resolve(res.data.results);
  }, function(err) {
    dfd.reject(err);
  });
  return dfd.promise;
}];

export default loadPermissions;
