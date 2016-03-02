aleph.directive('searchResult', ['$location', '$route', '$rootScope', 'Query', function($location, $route, $rootScope, Query) {
  return {
    restrict: 'E',
    scope: {
      'doc': '=',
      'result': '='
    },
    templateUrl: 'search_result.html',
    link: function (scope, element, attrs) {

      scope.filterSource = function(source_id) {
        Query.set('filter:source_id', source_id + '');
      };

      scope.viewDetails = function(rec) {
        var query = $location.search(),
            search = {
              ctx: alephUrlBlob(query),
              q: query.q,
              dq: query.q
            };
        $rootScope.reportLoading(true);
        if (scope.doc.type === 'tabular') {
          var sheet = rec ? rec.sheet : 0,
              row = rec ? rec.row_id : 0;
          $location.path('/tabular/' + scope.doc.id + '/' + sheet);
          search.row = row;
          $location.search(search);
        } else {
          var page = rec ? rec.page : 1;
          $location.path('/text/' + scope.doc.id);
          search.page = page;
        }
        $location.search(search);
      };

    }
  };
}]);
