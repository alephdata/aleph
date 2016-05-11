
aleph.factory('History', [function() {
  var lastSearch = {};

  return {
      setLastSearch: function(last) {
        lastSearch = last;
      },
      getLastSearch: function() {
        return lastSearch;
      }
  };
}]);
