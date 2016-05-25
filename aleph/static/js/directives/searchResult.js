aleph.directive('searchResult', ['$location', '$route', '$sce', '$httpParamSerializer',
    function($location, $route, $sce, $httpParamSerializer) {
  return {
    restrict: 'E',
    scope: {
      'doc': '=',
      'result': '=',
      'query': '='
    },
    templateUrl: 'templates/search_result.html',
    link: function (scope, element, attrs) {
      
      for (var i in scope.result.sources.values) {
        var source = scope.result.sources.values[i];
        if (source.id === scope.doc.source_id) {
          scope.source = source;
        }
      }
      for (var j in scope.doc.records.results) {
        var rec = scope.doc.records.results[j];
        rec.snippets = [];
        for (var n in rec.text) {
          var text = rec.text[n];
          rec.snippets.push($sce.trustAsHtml(text));
        }
      }

      scope.filterSource = function(source_id) {
        scope.query.toggleFilter('source_id', source_id);
      };

      scope.getUrl = function(rec) {
        var search = $location.search(),
            query = {},
            path = null;
        if (scope.doc.type === 'tabular') {
          var sheet = rec ? rec.sheet : 0,
              row = rec ? rec.row_id : null;
          query.row = row;
          path = '/tabular/' + scope.doc.id + '/' + sheet;
        } else {
          path = '/text/' + scope.doc.id;
          query.page = rec ? rec.page : 1;
          query.dq = search.q;
        }
        return path + '?' + $httpParamSerializer(query);
      };

      scope.viewDetails = function(rec) {
        window.location.href = scope.getUrl(rec);
      }

    }
  };
}]);
