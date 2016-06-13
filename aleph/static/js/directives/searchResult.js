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
      
      var collections = [];
      for (var i in scope.result.facets.collections.values) {
        var collection = scope.result.facets.collections.values[i];
        if (scope.doc.collection_id.indexOf(collection.id) != -1) {
          collections.push(collection);
        }
      }
      scope.collections = collections;

      for (var j in scope.doc.records.results) {
        var rec = scope.doc.records.results[j];
        rec.snippets = [];
        for (var n in rec.text) {
          var text = rec.text[n];
          rec.snippets.push($sce.trustAsHtml(text));
        }
      }

      scope.filterCollection = function(collection_id) {
        scope.query.toggleFilter('collection_id', collection_id);
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
