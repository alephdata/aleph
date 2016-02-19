aleph.directive('searchResult', ['$location', '$rootScope', 'Query', function($location, $rootScope, Query) {
  return {
    restrict: 'E',
    scope: {
      'doc': '=',
      'result': '='
    },
    templateUrl: 'search_result.html',
    link: function (scope, element, attrs) {

      scope.viewDetails = function(rec) {
        $location.search({});
        $rootScope.reportLoading(true);
        if (scope.doc.type === 'tabular') {
          var sheet = rec ? rec.sheet : 0,
              row = rec ? rec.row_id : 0;
          $location.path('/tabular/' + scope.doc.id + '/' + sheet);
          $location.search({
            'row': row,
            'q': Query.state.q,
            'dq': Query.state.q,
            'entity': Query.state.entity
          });
        } else {
          var page = rec ? rec.page : 1;
          $location.path('/text/' + scope.doc.id);
          $location.search({
            'page': page,
            'q': Query.state.q,
            'dq': Query.state.q,
            'entity': Query.state.entity
          });
        }
      };

    }
  };
}]);
