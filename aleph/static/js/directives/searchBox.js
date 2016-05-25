aleph.directive('searchBox', ['$location', '$q', '$route', '$http', '$rootScope',
    function($location, $q, $route, $http, $rootScope) {
  return {
    restrict: 'E',
    scope: {
      query: '='
    },
    templateUrl: 'templates/search_box.html',
    link: function (scope, element, attrs) {
      scope.suggestEntities = function(prefix) {
        var dfd = $q.defer();
        var opts = {
          params: {'prefix': prefix, 'min_count': 2},
          ignoreLoadingBar: true,
          cache: true
        };
        $http.get('/api/1/entities/_suggest', opts).then(function(res) {
          dfd.resolve(res.data.results);
        });
        return dfd.promise;
      }

      scope.acceptSuggestion = function($item) {
        scope.query.state.q = '';
        scope.query.toggle('entity', $item.id);
        $location.path('/search');
      }

      scope.submitSearch = function(form) {
        $location.path('/search');
        scope.query.set('q', scope.query.state.q);
      };
    }
  };
}]);
