var loadRoles= ['$q', 'Role', function($q, Role) {
  var dfd = $q.defer();
  Role.getAll().then(function(res) {
    var roles = [];
    for (var i in res.results) {
      var role = res.results[i];
      if (role.type == 'user') {
        roles.push(role);  
      }
    }
    dfd.resolve(roles);
  }, function(err) {
    dfd.reject(err);
  });
  return dfd.promise;
}];
