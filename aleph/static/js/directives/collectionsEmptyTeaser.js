aleph.directive('collectionsEmptyTeaser', ['Ingest', function(Ingest) {
  return {
    restrict: 'E',
    scope: {
      'collection': '='
    },
    templateUrl: 'templates/collections/empty_teaser.html',
    link: function (scope, element, attrs) {

      scope.ingestFiles = function() {
        Ingest.files([], scope.collection);
      };
    }
  };
}]);
