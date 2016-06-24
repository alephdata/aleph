
aleph.directive('metadataSidebar', ['$route', 'Collection', 'Document', 'Authz',
    function($route, Collection, Document, Authz) {
  return {
    restrict: 'E',
    scope: {
      'doc': '='
    },
    templateUrl: 'templates/metadata_sidebar.html',
    link: function (scope, element, attrs, model) {
      scope.authz = Authz;

      scope.editDocument = function() {
        Document.edit(scope.doc.id).then(function(res) {
          $route.reload();
        })
      };

      Collection.index().then(function(data) {
        var collections = [];
        for (var id in scope.doc.collection_id) {
          var id = scope.doc.collection_id[id];
          for (var j in data) {
            var collection = data[j];
            if (collection.id == id) {
              collections.push(collection);
            }
          }
        };
        scope.collections = collections;
      });
    }
  };
}]);
