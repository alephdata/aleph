aleph.directive('watchlistsFrame', ['$http', function($http) {
  return {
    restrict: 'E',
    transclude: true,
    scope: {
      'watchlist': '=',
      'selected': '@'
    },
    templateUrl: 'watchlists_frame.html',
    link: function (scope, element, attrs, model) {
      $http.get('/api/1/watchlists').then(function(res) {
        scope.watchlists = res.data;
      })
    }
  };
}]);
