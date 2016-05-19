
aleph.factory('Authz', ['$rootScope', function($rootScope) {
  var collection = function(right, collection_id) {
    if ($rootScope.session.permissions.collections && $rootScope.session.permissions.collections[right]) {
      return $rootScope.session.permissions.collections[right].indexOf(collection_id) != -1;
    }
    return false;
  };

  var source = function(right, source_id) {
    if ($rootScope.session.permissions.sources && $rootScope.session.permissions.sources[right]) {
      return $rootScope.session.permissions.sources[right].indexOf(source_id) != -1;
    }
    return false;
  };

  return {
    collection: collection,
    source: source,
    entityWrite: function(entity) {
      for (var i in entity.collections) {
        var coll_id = entity.collections[i];
        if (collection('write', coll_id)) {
          return true;
        }
      }
      return false;
    },
    logged_in: function() {
      return $rootScope.session && $rootScope.session.logged_in;
    },
    is_admin: function() {
      return $rootScope.session && $rootScope.session.role && $rootScope.session.role.is_admin;
    },
    READ: 'read',
    WRITE: 'write'
  }
}]);
