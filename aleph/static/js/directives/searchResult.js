aleph.directive('searchResult', ['$location', '$route', '$rootScope', 'Query', function($location, $route, $rootScope, Query) {
  return {
    restrict: 'E',
    scope: {
      'doc': '=',
      'result': '='
    },
    templateUrl: 'templates/search_result.html',
    link: function (scope, element, attrs) {
      scope.source = {};

      scope.filterSource = function(source_id) {
        Query.set('filter:source_id', source_id + '');
      };

      scope.$watch('doc', function(doc) {
        for (var i in scope.result.sources.values) {
          var source = scope.result.sources.values[i];
          if (source.id === doc.source_id) {
            scope.source = source;
          }
        }
      });

      scope.getUrl = function(rec) {
        var search = $location.search(),
            query = {},
            path = null;
        if (scope.doc.type === 'tabular') {
          var sheet = rec ? rec.sheet : 0,
              row = rec ? rec.row_id : null;
          query.row = row;
          path = '/#/tabular/' + scope.doc.id + '/' + sheet;
        } else {
          path = '/#/text/' + scope.doc.id;
          query.page = rec ? rec.page : 1;
          query.dq = search.q;
        }
        return path + '?' + queryString(query);
      };

      scope.viewDetails = function(rec) {
        window.location.href = scope.getUrl(rec);
      }

    }
  };
}]);
