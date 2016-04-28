aleph.directive('searchBox', ['$location', '$q', '$route', '$http', '$rootScope', 'Query',
    function($location, $q, $route, $http, $rootScope, Query) {
  return {
    restrict: 'E',
    scope: {
    },
    templateUrl: 'templates/search_box.html',
    link: function (scope, element, attrs) {
      scope.query = $location.search();

      scope.suggestEntities = function(prefix) {
        var dfd = $q.defer();
        var opts = {params: {'prefix': prefix}, ignoreLoadingBar: true};
        $http.get('/api/1/entities/_suggest', opts).then(function(res) {
          dfd.resolve(res.data.results);
        });
        return dfd.promise;
      }

      scope.acceptSuggestion = function($item) {
        scope.query.q = '';
        Query.toggleFilter('entity', $item.id);
        $location.path('/search');
      }

      scope.submitSearch = function(form) {
        var search = Query.load();
        search.q = scope.query.q;
        $location.search(search);
        $location.path('/search');
      };
    }
  };
}]);
