var loadRoles = ['$q', '$route', '$http', 'Role', function($q, $route, $http, Role) {
  var dfd = $q.defer(),
      collectionId = $route.current.params.collection_id,
      permUrl = '/api/1/collections/' + collectionId + '/permissions';
  
  Role.getAll().then(function(allRoles) {
    for (var j in allRoles) {
      var role = allRoles[j];
      role.read = false;
      role.write = false;
      role.dirty = false;
    }
    $http.get(permUrl).then(function(res) {
      for (var i in res.data.results) {
        var perm = res.data.results[i];
        for (var j in allRoles) {
          var role = allRoles[j];
          if (role.id == perm.role) {
            role.read = perm.read;
            role.write = perm.write;
          }
        }
      }
      dfd.resolve(allRoles);
    });
  }, function(err) {
    dfd.reject(err);
  });
  return dfd.promise;
}];
