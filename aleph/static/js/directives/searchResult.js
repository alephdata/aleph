aleph.directive('searchResult', ['$location', '$route', '$sce', '$httpParamSerializer', 'Collection', 'Document',
    function($location, $route, $sce, $httpParamSerializer, Collection, Document) {
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

      scope.getUrl = function(record) {
        return Document.getUrl(scope.doc, record);
      };

      scope.viewDetails = function(record) {
        window.location.href = scope.getUrl(record);
      };

    }
  };
}]);
