
aleph.factory('Authz', ['$rootScope', function($rootScope) {
  return {
    watchlist: function(right, watchlist_id) {
      if ($rootScope.session.permissions.watchlists && $rootScope.session.permissions.watchlists[right]) {
        return $rootScope.session.permissions.watchlists[right].indexOf(watchlist_id) != -1;
      }
      return false;
    },
    source: function(right, source_id) {
      if ($rootScope.session.permissions.sources && $rootScope.session.permissions.sources[right]) {
        return $rootScope.session.permissions.sources[right].indexOf(source_id) != -1;
      }
      return false;
    },
    READ: 'read',
    WRITE: 'write'
  }
}]);
