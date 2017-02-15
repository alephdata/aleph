
aleph.directive('metadataSidebar', ['$route', 'Collection', 'Document', 'Authz',
    function($route, Collection, Document, Authz) {
  return {
    restrict: 'E',
    scope: {
      'doc': '='
    },
    templateUrl: 'templates/documents/metadata.html',
    link: function (scope, element, attrs, model) {
      scope.authz = Authz;

      scope.editDocument = function() {
        Document.edit(scope.doc.id).then(function(res) {
          $route.reload();
        })
      };

      Collection.get(scope.doc.source_collection_id).then(function(coll) {
        scope.sourceCollection = coll;
      });
    }
  };
}]);
