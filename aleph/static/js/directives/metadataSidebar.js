
aleph.directive('metadataSidebar', ['Collection', function(Collection) {
  return {
    restrict: 'E',
    scope: {
      'doc': '='
    },
    templateUrl: 'templates/metadata_sidebar.html',
    link: function (scope, element, attrs, model) {
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
