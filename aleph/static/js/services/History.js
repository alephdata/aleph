import aleph from '../aleph';

aleph.factory('History', ['$location', function($location) {
  var lastUrl = null;

  return {
    setLastSearch: function(url) {
      lastUrl = url;
    },
    hasLastSearch: function() {
      return lastUrl !== null;
    },
    back: function() {
      $location.url(lastUrl);
    }
  };
}]);
