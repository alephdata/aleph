import aleph from '../aleph';

aleph.directive('searchBox', ['$location', '$q', '$route', '$http', '$rootScope',
    function($location, $q, $route, $http, $rootScope) {
  return {
    restrict: 'E',
    scope: {
      query: '='
    },
    templateUrl: 'templates/documents/search_box.html',
    link: function (scope, element, attrs) {
      scope.sortOptions = {
        score: 'Relevancy',
        newest: 'Newest',
        oldest: 'Oldest'
      };

      scope.suggestEntities = function(prefix) {
        var dfd = $q.defer();
        var opts = {
          params: {'prefix': prefix, 'min_count': 1},
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
        scope.query.toggle('filter:entities.id', $item.id);
      }

      scope.submitSearch = function(form) {
        scope.query.set('q', scope.query.state.q);
      };
    }
  };
}]);
