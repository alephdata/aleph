import aleph from '../aleph';

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
      var collectionFacet = scope.result.facets.collections || {},
          collections = collectionFacet.values || [];

      for (var i in collections) {
        var collection = collections[i];
        if (collection.id == scope.doc.collection_id) {
          scope.collection = collection;
        }
      }

      scope.$watch('doc', function(doc) {
        for (var j in doc.records.results) {
          var record = doc.records.results[j];
          record.snippet = $sce.trustAsHtml(record.text);
        }
      });

      scope.getUrl = function(record) {
        return Document.getUrl(scope.doc, record);
      };

      scope.viewDetails = function(record) {
        window.location.href = scope.getUrl(record);
      };

    }
  };
}]);
