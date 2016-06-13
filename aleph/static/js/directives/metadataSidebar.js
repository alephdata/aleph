
aleph.directive('metadataSidebar', ['Metadata', function(Metadata) {
  return {
    restrict: 'E',
    scope: {
      'doc': '='
    },
    templateUrl: 'templates/metadata_sidebar.html',
    link: function (scope, element, attrs, model) {
      Metadata.get().then(function(metadata) {
        var collections = [];
        for (var id in scope.doc.collection_id) {
          var id = scope.doc.collection_id[id];
          collections.push(metadata.collections[id]);
        };
        scope.collections = collections;
      });
    }
  };
}]);
