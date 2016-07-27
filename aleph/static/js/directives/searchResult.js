aleph.directive('searchResult', ['$location', '$route', '$sce', '$httpParamSerializer', 'Collection',
    function($location, $route, $sce, $httpParamSerializer, Collection) {
  return {
    restrict: 'E',
    scope: {
      'doc': '=',
      'result': '=',
      'query': '='
    },
    templateUrl: 'templates/search_result.html',
    link: function (scope, element, attrs) {

      scope.collection = null;
      var coll_id = scope.doc.source_collection_id || scope.doc.collection_id[0];
      Collection.index().then(function(collections) {
        for (var i in collections) {
          var collection = collections[i];
          if (collection.id == coll_id) {
            scope.collection = collection;
          }
        }
      });

      for (var j in scope.doc.records.results) {
        var rec = scope.doc.records.results[j];
        rec.snippets = [];
        for (var n in rec.text) {
          var text = rec.text[n];
          rec.snippets.push($sce.trustAsHtml(text));
        }
      }

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
