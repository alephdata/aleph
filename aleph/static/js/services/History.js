
aleph.factory('History', ['$location', function($location) {
  var lastSearch = {}, lastPath = null;

  return {
    setLastSearch: function(path, search) {
      lastPath = path;
      lastSearch = search;
    },
    back: function() {
      $location.path(lastPath);
      $location.search(lastSearch);
    }
  };
}]);
