import aleph from '../aleph';

aleph.directive('collectionsEmptyTeaser', ['$location', 'Ingest', function($location, Ingest) {
  return {
    restrict: 'E',
    scope: {
      'collection': '='
    },
    templateUrl: 'templates/collections/empty_teaser.html',
    link: function (scope, element, attrs) {
      scope.ingestFiles = function() {
        Ingest.files([], scope.collection).then(function() {
          $location.path('/collections/' + scope.collection.id + '/states');
        });
      };
    }
  };
}]);
