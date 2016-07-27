aleph.directive('searchBox', ['$location', '$q', '$route', '$http', '$rootScope',
    function($location, $q, $route, $http, $rootScope) {
  return {
    restrict: 'E',
    scope: {
      query: '='
    },
    templateUrl: 'templates/search_box.html',
    link: function (scope, element, attrs) {
      scope.sortOptions = {
        score: 'Relevancy',
        newest: 'Newest',
        oldest: 'Oldest'
      };

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
      }

      scope.submitSearch = function(form) {
        scope.query.set('q', scope.query.state.q);
      };
    }
  };
}]);
