aleph.directive('searchResult', ['$location', '$route', '$sce', 'Document',
    function($location, $route, $sce, Document) {
  return {
    restrict: 'E',
    scope: {
      'doc': '=',
      'result': '=',
      'query': '='
    },
    templateUrl: 'templates/documents/search_result.html',
    link: function (scope, element, attrs) {
      var collectionId = scope.doc.source_collection_id || scope.doc.collection_id[0],
          collectionFacet = scope.result.facets.collections || {},
          collections = collectionFacet.values || [];

      for (var i in collections) {
        var collection = collections[i];
        if (collection.id == collectionId) {
          scope.sourceCollection = collection;
        }
      }

      for (var j in scope.doc.records.results) {
        var rec = scope.doc.records.results[j];
        rec.snippets = [];
        for (var n in rec.text) {
          var text = rec.text[n];
          if (text && text.length > 2) {
            rec.snippets.push($sce.trustAsHtml(text));  
          }
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
